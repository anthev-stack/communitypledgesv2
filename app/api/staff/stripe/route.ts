import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_CONNECT_ACCOUNT_ID } from '@/lib/stripe';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Determine environment based on Stripe keys
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    
    const config = {
      accountId: isLiveMode ? 'acct_live_platform' : 'acct_test_123',
      businessProfile: {
        name: isLiveMode ? 'CommunityPledges Live Account' : 'CommunityPledges Test Account'
      },
      capabilities: {
        card_payments: 'active',
        transfers: 'active'
      },
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      country: 'US',
      defaultCurrency: 'usd',
      environment: isLiveMode ? 'live' : 'test'
    };

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
