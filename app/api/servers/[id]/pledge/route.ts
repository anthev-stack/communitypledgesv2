import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, calculatePlatformFee, calculateStripeFee, calculateNetAmount } from '@/lib/stripe'
import { isUserPaymentSuspended } from '@/lib/payment-failure'
import { sendDiscordWebhook, createPledgeNotificationEmbed, createUnpledgeNotificationEmbed } from '@/lib/discord-webhook'
import { z } from 'zod'

// Function to calculate optimized cost distribution
function calculateOptimizedCosts(pledgeAmounts: number[], serverCost: number, minCostPerPerson: number) {
  const totalPledged = pledgeAmounts.reduce((sum, amount) => sum + amount, 0)
  const pledgeCount = pledgeAmounts.length
  
  // If no pledges, accept new ones
  if (pledgeCount === 0) {
    return {
      optimizedCosts: [],
      isAcceptingPledges: true,
      maxPeople: Math.floor(serverCost / minCostPerPerson)
    }
  }
  
  // Calculate maximum people we can have at minimum cost
  const maxPeople = Math.floor(serverCost / minCostPerPerson)
  
  // If we have more people than max, stop accepting
  if (pledgeCount >= maxPeople) {
    return {
      optimizedCosts: new Array(pledgeCount).fill(minCostPerPerson),
      isAcceptingPledges: false,
      maxPeople
    }
  }
  
  // If total pledged is less than server cost, accept more pledges
  if (totalPledged < serverCost) {
    return {
      optimizedCosts: pledgeAmounts, // Users pay what they pledged
      isAcceptingPledges: true,
      maxPeople
    }
  }
  
  // Total pledged >= server cost, optimize distribution
  // Start with everyone paying their pledged amount
  let optimizedCosts = [...pledgeAmounts]
  let excess = totalPledged - serverCost
  
  // Create array of indices sorted by pledge amount (highest first)
  const sortedIndices = pledgeAmounts
    .map((amount, index) => ({ amount, index }))
    .sort((a, b) => b.amount - a.amount)
    .map(item => item.index)
  
  // Distribute excess by reducing costs among higher pledgers
  // We want to balance costs fairly among those who can afford to split
  let remainingExcess = excess
  
  // Create a more sophisticated balancing algorithm
  // First, identify who can participate in cost reduction (pledged more than minimum)
  const eligiblePledgers = sortedIndices.filter(index => 
    optimizedCosts[index] > minCostPerPerson
  )
  
  if (eligiblePledgers.length > 0) {
    // Calculate how much each eligible pledger can contribute to cost reduction
    const totalReducible = eligiblePledgers.reduce((sum, index) => 
      sum + (optimizedCosts[index] - minCostPerPerson), 0
    )
    
    if (remainingExcess <= totalReducible) {
      // We can balance the costs fairly
      // Distribute the excess proportionally among eligible pledgers
      for (const index of eligiblePledgers) {
        const currentCost = optimizedCosts[index]
        const maxReduction = currentCost - minCostPerPerson
        const proportionalReduction = (maxReduction / totalReducible) * remainingExcess
        
        optimizedCosts[index] = currentCost - proportionalReduction
      }
      remainingExcess = 0
    } else {
      // Reduce everyone to minimum and distribute remaining excess
      for (const index of eligiblePledgers) {
        const currentCost = optimizedCosts[index]
        const reduction = currentCost - minCostPerPerson
        optimizedCosts[index] = minCostPerPerson
        remainingExcess -= reduction
      }
    }
  }
  
  // Check if we can accept more people
  // We can accept more if we haven't reached the maximum number of people
  // and we haven't optimized everyone down to the minimum cost
  const canAcceptMore = pledgeCount < maxPeople
  
  return {
    optimizedCosts,
    isAcceptingPledges: canAcceptMore,
    maxPeople
  }
}

const pledgeSchema = z.object({
  amount: z.number().min(0.01).max(1000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has payment method
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        hasPaymentMethod: true, 
        stripePaymentMethodId: true,
        stripeCustomerId: true
      }
    })

    if (!user?.hasPaymentMethod || !user?.stripePaymentMethodId) {
      return NextResponse.json(
        { message: 'Payment method required. Please add a payment method in your settings.' },
        { status: 400 }
      )
    }

    // Check if user is payment suspended
    const isSuspended = await isUserPaymentSuspended(session.user.id)
    if (isSuspended) {
      return NextResponse.json(
        { message: 'Account suspended due to payment failures. Please contact support.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { amount } = pledgeSchema.parse(body)
    const serverId = params.id

    // Get server with current pledges and owner's Stripe Connect account
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: {
        id: true,
        name: true,
        cost: true,
        isActive: true,
        discordWebhook: true,
        pledges: true,
        owner: {
          select: {
            stripeAccountId: true
          }
        }
      }
    })

    if (!server) {
      return NextResponse.json(
        { message: 'Server not found' },
        { status: 404 }
      )
    }

    if (!server.isActive) {
      return NextResponse.json(
        { message: 'Server is not active' },
        { status: 400 }
      )
    }

    // Check if user already has a pledge for this server
    const existingPledge = await prisma.pledge.findUnique({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId: serverId
        }
      }
    })

    if (existingPledge) {
      return NextResponse.json(
        { message: 'You already have a pledge for this server' },
        { status: 400 }
      )
    }

    // Check if server can accept more pledges using optimization logic
    const pledgeAmounts = server.pledges.map(p => p.amount)
    const { isAcceptingPledges } = calculateOptimizedCosts(pledgeAmounts, server.cost, 2.0)

    if (!isAcceptingPledges) {
      return NextResponse.json(
        { message: 'This server is not currently accepting new pledges' },
        { status: 400 }
      )
    }

    // Create the pledge record (no immediate payment)
    const pledge = await prisma.pledge.create({
      data: {
        amount,
        userId: session.user.id,
        serverId: serverId,
        status: 'active' // Pledge is active but not yet charged
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        server: {
          select: {
            name: true,
            ownerId: true
          }
        }
      }
    })

    // Log pledge activity
    await prisma.activityLog.create({
      data: {
        type: 'pledge',
        message: `You pledged $${amount.toFixed(2)} to ${pledge.server.name}`,
        amount: amount,
        userId: session.user.id,
        serverId: serverId
      }
    })

    // Log activity for the server owner (if different from pledger)
    if (pledge.server.ownerId !== session.user.id) {
      await prisma.activityLog.create({
        data: {
          type: 'server_pledge',
          message: `${pledge.user.name} pledged $${amount.toFixed(2)} to your server "${pledge.server.name}"`,
          amount: amount,
          userId: pledge.server.ownerId,
          serverId: serverId
        }
      })
    }

    // Send Discord webhook notification if configured
    if (server.discordWebhook) {
      try {
        const totalPledged = server.pledges.reduce((sum, pledge) => sum + pledge.amount, 0) + amount
        const pledgerCount = server.pledges.length + 1
        
        const embed = createPledgeNotificationEmbed(
          server.name,
          pledge.user.name,
          amount,
          server.cost,
          totalPledged,
          pledgerCount
        )

        await sendDiscordWebhook(server.discordWebhook, {
          embeds: [embed]
        })
      } catch (error) {
        console.error('Failed to send Discord webhook notification:', error)
        // Don't fail the pledge creation if webhook fails
      }
    }

    // Update server pledge count
    await prisma.server.update({
      where: { id: serverId },
      data: {
        currentPledges: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ 
      pledge,
      message: 'Pledge created successfully. You will be charged 2 days before the monthly payment due date.'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating pledge:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const serverId = params.id

    // Find and delete the pledge
    const pledge = await prisma.pledge.findUnique({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId: serverId
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        server: {
          select: {
            name: true,
            cost: true,
            discordWebhook: true,
            ownerId: true,
            pledges: true
          }
        }
      }
    })

    if (!pledge) {
      return NextResponse.json(
        { message: 'Pledge not found' },
        { status: 404 }
      )
    }

    await prisma.pledge.delete({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId: serverId
        }
      }
    })

    // Log activity for the user who unpledged
    await prisma.activityLog.create({
      data: {
        type: 'unpledge',
        message: `You unpledged $${pledge.amount.toFixed(2)} from ${pledge.server.name}`,
        amount: pledge.amount,
        userId: session.user.id,
        serverId: serverId
      }
    })

    // Log activity for the server owner (if different from pledger)
    if (pledge.server.ownerId !== session.user.id) {
      await prisma.activityLog.create({
        data: {
          type: 'server_unpledge',
          message: `${pledge.user.name} unpledged $${pledge.amount.toFixed(2)} from your server "${pledge.server.name}"`,
          amount: pledge.amount,
          userId: pledge.server.ownerId,
          serverId: serverId
        }
      })
    }

    // Send Discord webhook notification if configured
    if (pledge.server.discordWebhook) {
      try {
        // Calculate updated totals after the unpledge
        const remainingPledges = pledge.server.pledges.filter(p => p.userId !== session.user.id)
        const totalPledged = remainingPledges.reduce((sum, p) => sum + p.amount, 0)
        const pledgerCount = remainingPledges.length
        
        const embed = createUnpledgeNotificationEmbed(
          pledge.server.name,
          pledge.user.name,
          pledge.amount,
          pledge.server.cost,
          totalPledged,
          pledgerCount
        )

        await sendDiscordWebhook(pledge.server.discordWebhook, {
          embeds: [embed]
        })
      } catch (error) {
        console.error('Failed to send Discord webhook notification:', error)
        // Don't fail the unpledge if webhook fails
      }
    }

    // Update server pledge count
    await prisma.server.update({
      where: { id: serverId },
      data: {
        currentPledges: {
          decrement: 1
        }
      }
    })

    return NextResponse.json({ message: 'Pledge removed successfully' })
  } catch (error) {
    console.error('Error removing pledge:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
