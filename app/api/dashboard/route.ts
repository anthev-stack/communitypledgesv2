import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateServerWithdrawalDate } from '@/lib/withdrawal'
import { getUserPaymentStatus } from '@/lib/payment-failure'

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
  const canAcceptMore = pledgeCount < maxPeople
  
  return {
    optimizedCosts,
    isAcceptingPledges: canAcceptMore,
    maxPeople
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's pledges with server withdrawal day
    const userPledges = await prisma.pledge.findMany({
      where: {
        userId: session.user.id,
        status: 'active' // Only active pledges
      },
      include: {
        server: {
          select: {
            name: true,
            withdrawalDay: true,
            cost: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get user's servers
    const userServers = await prisma.server.findMany({
      where: {
        ownerId: session.user.id
      },
      include: {
        pledges: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        serverBoosts: {
          where: {
            isActive: true,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            pledges: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate stats
    const totalPledged = userPledges.reduce((sum, pledge) => sum + pledge.amount, 0)
    const activePledges = userPledges.length
    const serversCreated = userServers.length

    // Get user's payment status
    const paymentStatus = await getUserPaymentStatus(session.user.id)

    // Calculate next pledge charges with optimized costs
    const nextPledgeCharges = await Promise.all(userPledges.map(async (pledge) => {
      const nextChargeDate = calculateServerWithdrawalDate(pledge.server.withdrawalDay)
      const now = new Date()
      const daysUntilCharge = Math.ceil((nextChargeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // Get all pledges for this server to calculate optimized cost
      const serverPledges = await prisma.pledge.findMany({
        where: {
          serverId: pledge.server.id,
          status: 'active'
        },
        select: {
          amount: true,
          userId: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
      
      const pledgeAmounts = serverPledges.map(p => p.amount)
      const minCostPerPerson = 2
      
      const { optimizedCosts } = calculateOptimizedCosts(
        pledgeAmounts,
        pledge.server.cost,
        minCostPerPerson
      )
      
      // Find the user's position in the pledges array to get their optimized cost
      const userPledgeIndex = serverPledges.findIndex(p => p.userId === session.user.id)
      const actualCost = userPledgeIndex >= 0 ? optimizedCosts[userPledgeIndex] : pledge.amount
      const savings = Math.max(0, pledge.amount - actualCost)
      
      return {
        serverName: pledge.server.name,
        pledgedAmount: pledge.amount,
        actualCost: actualCost,
        savings: savings,
        nextChargeDate: nextChargeDate.toISOString(),
        daysUntilCharge: Math.max(0, daysUntilCharge),
        serverId: pledge.server.id
      }
    }))
    
    // Sort by days until charge
    nextPledgeCharges.sort((a, b) => a.daysUntilCharge - b.daysUntilCharge)


    // Calculate dynamic pricing for user's servers
    const serversWithPricing = userServers.map(server => {
      const totalPledged = server.pledges.reduce((sum, pledge) => sum + pledge.amount, 0)
      const pledgeCount = server.pledges.length
      const remainingCost = Math.max(0, server.cost - totalPledged)
      
      // Server is fully funded when total pledged >= server cost
      const isFullyFunded = totalPledged >= server.cost
      
      // Calculate what the cost per person would be if we divided equally among current pledgers
      const equalDivision = pledgeCount > 0 ? server.cost / pledgeCount : server.cost
      
      // Show the equal division cost, but users only pay what they pledged
      const costPerPerson = equalDivision

      // Check if server has active boost
      const activeBoost = server.serverBoosts?.find(boost => 
        boost.isActive && new Date(boost.expiresAt) > new Date()
      );

      return {
        id: server.id,
        name: server.name,
        description: server.description,
        cost: server.cost,
        withdrawalDay: server.withdrawalDay,
        gameType: server.gameType,
        region: server.region,
        bannerUrl: server.bannerUrl,
        serverIp: server.serverIp,
        serverPort: server.serverPort,
        discordChannel: server.discordChannel,
        discordWebhook: server.discordWebhook,
        tags: server.tags,
        currentPledges: server.pledges.length,
        costPerPerson: Math.round(costPerPerson * 100) / 100,
        isAcceptingPledges: !isFullyFunded,
        remainingCost: Math.round(remainingCost * 100) / 100,
        isFullyFunded,
        status: server.isActive ? 'active' : 'inactive',
        isActive: server.isActive,
        hasActiveBoost: !!activeBoost,
        boostExpiresAt: activeBoost?.expiresAt
      }
    })


    // Get recent activity (user's personal activities)
    const recentActivityLogs = await prisma.activityLog.findMany({
      where: {
        userId: session.user.id,
        type: {
          in: ['pledge', 'unpledge', 'server_created', 'server_boost', 'payment_processed', 'deposit_received']
        }
      },
      include: {
        user: {
          select: { name: true }
        },
        server: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get server activity (activities on user's servers)
    const serverActivityLogs = await prisma.activityLog.findMany({
      where: {
        server: { 
          ownerId: session.user.id 
        },
        type: {
          in: ['server_pledge', 'server_unpledge', 'deposit_received']
        }
      },
      include: {
        user: {
          select: { name: true }
        },
        server: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Convert activity logs to dashboard format
    const recentActivity = recentActivityLogs.map(activity => ({
      id: activity.id,
      type: activity.type,
      message: activity.message,
      date: activity.createdAt.toISOString(),
      amount: activity.amount,
      serverName: activity.server?.name,
      userName: activity.user?.name
    }))

    const serverActivity = serverActivityLogs.map(activity => ({
      id: activity.id,
      type: activity.type,
      message: activity.message,
      date: activity.createdAt.toISOString(),
      amount: activity.amount,
      serverName: activity.server?.name,
      userName: activity.user?.name
    }))
    
    // Sort by date and take first 5
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    recentActivity.splice(5)

    const dashboardData = {
      stats: {
        totalPledged: Math.round(totalPledged * 100) / 100,
        activePledges,
        serversCreated
      },
      myServers: serversWithPricing,
      recentActivity,
      serverActivity,
      nextPledgeCharges,
      paymentStatus
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
