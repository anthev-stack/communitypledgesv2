import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Test with your actual Stripe account
    try {
      const account = await stripe.accounts.retrieve();
      
      return NextResponse.json({ 
        success: true,
        account: {
          id: account.id,
          business_profile: account.business_profile,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          country: account.country,
          default_currency: account.default_currency
        }
      });
    } catch (error) {
      console.error('Error testing Stripe account:', error);
      return NextResponse.json({ 
        success: false,
        message: 'Failed to connect to Stripe. Please check your API keys.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error testing Stripe connection:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to connect to Stripe. Please check your API keys.' 
    }, { status: 500 });
  }
}
