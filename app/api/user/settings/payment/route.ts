import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const paymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paymentMethodId } = paymentMethodSchema.parse(body)

    // Get or create Stripe customer
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, stripeCustomerId: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    let stripeCustomerId = user.stripeCustomerId
    
    // If we have a customer ID, verify it still exists in Stripe
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId)
      } catch (error) {
        // Customer doesn't exist in Stripe, clear it from our database
        console.log('Stripe customer not found, creating new one')
        stripeCustomerId = null
        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeCustomerId: null }
        })
      }
    }
    
    // Create a new customer if needed
    if (!stripeCustomerId) {
      // Create a new Stripe customer if one doesn't exist
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        metadata: {
          userId: user.id,
        },
      })
      stripeCustomerId = customer.id

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: stripeCustomerId }
      })
    }

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    })

    // Get payment method details
    const card = paymentMethod.card
    if (!card) {
      return NextResponse.json(
        { message: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Update user with payment method info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        hasPaymentMethod: true,
        cardLast4: card.last4,
        cardBrand: card.brand,
        cardExpMonth: card.exp_month,
        cardExpYear: card.exp_year,
        stripePaymentMethodId: paymentMethodId,
      }
    })

    return NextResponse.json({ 
      message: 'Payment method saved successfully',
      cardLast4: card.last4,
      cardBrand: card.brand
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving payment method:', error)
    return NextResponse.json(
      { message: 'Error saving payment method' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paymentMethodId } = paymentMethodSchema.parse(body)

    // Get current user to find old payment method and Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripePaymentMethodId: true, stripeCustomerId: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId
    
    // If we have a customer ID, verify it still exists in Stripe
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId)
      } catch (error) {
        // Customer doesn't exist in Stripe, clear it from our database
        console.log('Stripe customer not found, creating new one')
        stripeCustomerId = null
        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeCustomerId: null }
        })
      }
    }
    
    // Create a new customer if needed
    if (!stripeCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: session.user.email || undefined,
          name: session.user.name || undefined,
          metadata: {
            userId: session.user.id,
          },
        })
        stripeCustomerId = customer.id

        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeCustomerId: stripeCustomerId }
        })
      } catch (error) {
        console.error('Error creating Stripe customer:', error)
        return NextResponse.json(
          { message: 'Error creating Stripe customer' },
          { status: 500 }
        )
      }
    }

    // Detach old payment method if exists
    if (user.stripePaymentMethodId) {
      try {
        await stripe.paymentMethods.detach(user.stripePaymentMethodId)
        console.log('Successfully detached old payment method')
      } catch (error) {
        console.error('Error detaching old payment method (continuing anyway):', error)
        // Continue with the update even if detaching fails
        // The old payment method might not exist or might be on a different account
      }
    }

    // Attach new payment method
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    })

    // Get payment method details
    const card = paymentMethod.card
    if (!card) {
      return NextResponse.json(
        { message: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Update user with new payment method info
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasPaymentMethod: true,
        cardLast4: card.last4,
        cardBrand: card.brand,
        cardExpMonth: card.exp_month,
        cardExpYear: card.exp_year,
        stripePaymentMethodId: paymentMethodId,
      }
    })

    return NextResponse.json({ 
      message: 'Payment method updated successfully',
      cardLast4: card.last4,
      cardBrand: card.brand
    })
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { message: 'Error updating payment method' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to find payment method
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripePaymentMethodId: true }
    })

    // Detach payment method from Stripe
    if (user?.stripePaymentMethodId) {
      try {
        await stripe.paymentMethods.detach(user.stripePaymentMethodId)
        console.log('Successfully detached payment method')
      } catch (error) {
        console.error('Error detaching payment method (continuing anyway):', error)
        // Continue with deletion even if detaching fails
        // The payment method might not exist or might be on a different account
      }
    }

    // Get user's current pledges
    const userPledges = await prisma.pledge.findMany({
      where: { userId: session.user.id },
      include: {
        server: {
          select: { name: true }
        }
      }
    })

    // Remove all user's pledges and log unpledge activities
    if (userPledges.length > 0) {
      // Log unpledge activities before deleting
      for (const pledge of userPledges) {
        // Log for the user who unpledged
        await prisma.activityLog.create({
          data: {
            type: 'unpledge',
            message: `You unpledged $${pledge.amount.toFixed(2)} from ${pledge.server.name}`,
            amount: pledge.amount,
            userId: session.user.id,
            serverId: pledge.serverId
          }
        })

        // Log for the server owner (if different from user)
        const server = await prisma.server.findUnique({
          where: { id: pledge.serverId },
          select: { ownerId: true, name: true }
        })

        if (server && server.ownerId !== session.user.id) {
          await prisma.activityLog.create({
            data: {
              type: 'server_unpledge',
              message: `User unpledged $${pledge.amount.toFixed(2)} from your server "${server.name}"`,
              amount: pledge.amount,
              userId: server.ownerId,
              serverId: pledge.serverId
            }
          })
        }
      }

      await prisma.pledge.deleteMany({
        where: { userId: session.user.id }
      })
    }

    // Clear payment method data
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasPaymentMethod: false,
        cardLast4: null,
        cardBrand: null,
        cardExpMonth: null,
        cardExpYear: null,
        stripePaymentMethodId: null,
      }
    })

    return NextResponse.json({ 
      message: 'Payment method deleted successfully',
      unpledgedCount: userPledges.length,
      unpledgedServers: userPledges.map(p => p.server.name)
    })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { message: 'Error deleting payment method' },
      { status: 500 }
    )
  }
}