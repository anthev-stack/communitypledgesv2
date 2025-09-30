import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true }
    });

    if (!user?.stripeAccountId) {
      return NextResponse.json({ 
        hasAccount: false,
        message: 'No Stripe Connect account found'
      });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    return NextResponse.json({
      hasAccount: true,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
      businessProfile: account.business_profile
    });
  } catch (error) {
    console.error('Error checking Stripe Connect status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}



