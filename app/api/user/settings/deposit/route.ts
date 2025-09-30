import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { checkAndPauseServersForUser } from '@/lib/server-pause-utils'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already has a Stripe Connect account
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true }
    })

    // If we have an account ID, verify it still exists in Stripe
    if (user?.stripeAccountId) {
      try {
        await stripe.accounts.retrieve(user.stripeAccountId)
        return NextResponse.json({ 
          message: 'User already has a Stripe Connect account',
          accountId: user.stripeAccountId
        })
      } catch (error) {
        // Account doesn't exist in Stripe, clear it from our database
        console.log('Stripe Connect account not found, creating new one')
        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeAccountId: null, hasDepositMethod: false }
        })
        
        // Pause servers since user no longer has a valid deposit method
        await checkAndPauseServersForUser(session.user.id)
      }
    }

    // Create Stripe Connect account
    let account
    try {
      account = await stripe.accounts.create({
        type: 'express', // Express accounts are easier to set up
        country: 'US', // You can make this dynamic based on user location
        email: session.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual', // or 'company' based on your needs
        settings: {
          payouts: {
            schedule: {
              interval: 'daily' // or 'weekly', 'monthly'
            }
          }
        }
      })
    } catch (error: any) {
      if (error.message?.includes('Livemode requests must always be redirected via HTTPS')) {
        return NextResponse.json(
          { 
            message: 'Stripe Connect requires HTTPS in live mode. Please use a production domain or test mode for localhost.',
            error: 'HTTPS_REQUIRED'
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Save the account ID to the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        stripeAccountId: account.id,
        hasDepositMethod: true
      }
    })

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/settings?stripe_refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/settings?stripe_success=true`,
      type: 'account_onboarding'
    })

    // Unpause all servers owned by this user
    const userServers = await prisma.server.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true }
    })

    if (userServers.length > 0) {
      await prisma.server.updateMany({
        where: { ownerId: session.user.id },
        data: { isActive: true }
      })

      // Log server unpause activities
      for (const server of userServers) {
        await prisma.activityLog.create({
          data: {
            type: 'server_unpaused',
            message: `Your server "${server.name}" has been unpaused due to Stripe Connect setup`,
            userId: session.user.id,
            serverId: server.id
          }
        })
      }
    }

    return NextResponse.json({ 
      message: 'Stripe Connect account created successfully',
      accountId: account.id,
      onboardingUrl: accountLink.url,
      unpausedServers: userServers.map(s => s.name)
    })
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { message: 'Error creating Stripe Connect account' },
      { status: 500 }
    )
  }
}

export async function PUT() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Stripe Connect account
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true }
    })

    if (!user?.stripeAccountId) {
      return NextResponse.json(
        { message: 'No Stripe Connect account found' },
        { status: 404 }
      )
    }

    // Verify the account still exists in Stripe
    try {
      await stripe.accounts.retrieve(user.stripeAccountId)
    } catch (error) {
      // Account doesn't exist in Stripe, clear it from our database
      console.log('Stripe Connect account not found, clearing from database')
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeAccountId: null, hasDepositMethod: false }
      })
      
      // Pause servers since user no longer has a valid deposit method
      await checkAndPauseServersForUser(session.user.id)
      
      return NextResponse.json(
        { message: 'Stripe Connect account not found, please create a new one' },
        { status: 404 }
      )
    }

    // Create new account link for re-onboarding
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/settings?stripe_refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/settings?stripe_success=true`,
      type: 'account_onboarding'
    })

    return NextResponse.json({ 
      message: 'Stripe Connect re-onboarding link created',
      onboardingUrl: accountLink.url
    })
  } catch (error) {
    console.error('Error creating Stripe Connect re-onboarding link:', error)
    return NextResponse.json(
      { message: 'Error creating re-onboarding link' },
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

    // Get user's Stripe Connect account
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true }
    })

    // Delete Stripe Connect account if exists
    if (user?.stripeAccountId) {
      try {
        // First verify the account exists before trying to delete
        await stripe.accounts.retrieve(user.stripeAccountId)
        await stripe.accounts.del(user.stripeAccountId)
      } catch (error) {
        console.error('Error deleting Stripe Connect account:', error)
        // Continue even if Stripe deletion fails
      }
    }

    // Pause all servers owned by this user
    const userServers = await prisma.server.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true }
    })

    if (userServers.length > 0) {
      await prisma.server.updateMany({
        where: { ownerId: session.user.id },
        data: { isActive: false }
      })

      // Log server pause activities
      for (const server of userServers) {
        await prisma.activityLog.create({
          data: {
            type: 'server_paused',
            message: `Your server "${server.name}" has been paused due to Stripe Connect removal`,
            userId: session.user.id,
            serverId: server.id
          }
        })
      }
    }

    // Clear deposit method data
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasDepositMethod: false,
        stripeAccountId: null,
        bankAccountLast4: null,
        bankRoutingLast4: null,
        bankName: null
      }
    })

    return NextResponse.json({ 
      message: 'Stripe Connect account deleted successfully',
      pausedServers: userServers.map(s => s.name)
    })
  } catch (error) {
    console.error('Error deleting Stripe Connect account:', error)
    return NextResponse.json(
      { message: 'Error deleting Stripe Connect account' },
      { status: 500 }
    )
  }
}