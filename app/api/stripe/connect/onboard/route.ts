import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_CONNECT_ACCOUNT_ID } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a Stripe Connect account
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true }
    });

    if (user?.stripeAccountId) {
      return NextResponse.json({ 
        message: 'User already has a Stripe Connect account',
        accountId: user.stripeAccountId
      });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
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
    });

    // Save the account ID to the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeAccountId: account.id }
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/settings?stripe_refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/settings?stripe_success=true`,
      type: 'account_onboarding'
    });

    return NextResponse.json({ 
      accountId: account.id,
      onboardingUrl: accountLink.url
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}



