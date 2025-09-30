import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, calculatePlatformFee, calculateStripeFee, calculateNetAmount, STRIPE_CONNECT_ACCOUNT_ID } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { serverId, amount, type } = await request.json();

    if (!serverId || !amount || !type) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Validate amount
    if (amount < 1 || amount > 10000) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    // Get server details
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { user: true }
    });

    if (!server) {
      return NextResponse.json({ message: 'Server not found' }, { status: 404 });
    }

    if (!server.isActive) {
      return NextResponse.json({ message: 'Server is not active' }, { status: 400 });
    }

    // Calculate fees
    const platformFee = calculatePlatformFee(amount);
    const stripeFee = calculateStripeFee(amount);
    const netAmount = calculateNetAmount(amount);

    // For Stripe Connect, we need to handle the payment differently
    // Option 1: If server owner has Stripe Connect account
    if (server.user.stripeAccountId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        application_fee_amount: Math.round(platformFee * 100), // Platform fee in cents
        transfer_data: {
          destination: server.user.stripeAccountId, // Server owner's Stripe Connect account
        },
        metadata: {
          serverId,
          serverOwnerId: server.userId,
          payerId: session.user.id,
          type, // 'pledge' or 'boost'
          platformFee: platformFee.toString(),
          stripeFee: stripeFee.toString(),
          netAmount: netAmount.toString()
        }
      });

      return NextResponse.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } else {
      // Option 2: If server owner doesn't have Stripe Connect account
      // Payment goes to CommunityPledges, we'll handle the transfer manually
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          serverId,
          serverOwnerId: server.userId,
          payerId: session.user.id,
          type, // 'pledge' or 'boost'
          platformFee: platformFee.toString(),
          stripeFee: stripeFee.toString(),
          netAmount: netAmount.toString(),
          requiresManualTransfer: 'true'
        }
      });

      return NextResponse.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    }
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
