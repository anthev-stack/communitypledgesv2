import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ message: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret'
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 });
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { serverId, serverOwnerId, payerId, type, platformFee, stripeFee, netAmount } = paymentIntent.metadata;

    if (!serverId || !serverOwnerId || !payerId) {
      console.error('Missing required metadata in payment intent');
      return;
    }

    const amount = paymentIntent.amount / 100; // Convert cents to dollars

    // Update existing pledge to completed status
    if (type === 'pledge_payment') {
      await prisma.pledge.updateMany({
        where: {
          userId: payerId,
          serverId,
          status: 'pending'
        },
        data: {
          status: 'completed'
        }
      });

      // Update server pledge count
      await prisma.server.update({
        where: { id: serverId },
        data: {
          currentPledges: {
            increment: 1
          }
        }
      });

      // Get server and user names for activity logs
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        select: { name: true }
      });
      
      const user = await prisma.user.findUnique({
        where: { id: payerId },
        select: { name: true }
      });

      // Log activity for the user who pledged
      await prisma.activityLog.create({
        data: {
          type: 'payment_processed',
          message: `Payment of $${amount.toFixed(2)} processed for "${server?.name || 'a server'}" pledge`,
          amount: amount,
          userId: payerId,
          serverId: serverId
        }
      });

      // Log activity for the server owner (if different from pledger)
      if (serverOwnerId !== payerId) {
        await prisma.activityLog.create({
          data: {
            type: 'deposit_received',
            message: `You received $${amount.toFixed(2)} from community pledges for "${server?.name || ''}"`,
            amount: amount,
            userId: serverOwnerId,
            serverId: serverId
          }
        });
      }
    } else if (type === 'boost') {
      // Create server boost
      const boostExpiresAt = new Date();
      boostExpiresAt.setHours(boostExpiresAt.getHours() + 24); // 24 hours

      await prisma.serverBoost.create({
        data: {
          serverId,
          userId: payerId,
          amount: 3.00, // Fixed boost price
          expiresAt: boostExpiresAt
        }
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: payerId,
          serverId,
          type: 'server_boost',
          description: `Boosted server for A$3.00`,
          metadata: {
            amount: '3.00',
            platformFee: '0.03'
          }
        }
      });
    }

    // Log platform fee
    await prisma.activityLog.create({
      data: {
        type: 'platform_fee',
        description: `Platform fee collected: $${platformFee}`,
        metadata: {
          amount: platformFee,
          paymentIntentId: paymentIntent.id,
          serverId,
          serverOwnerId,
          payerId
        }
      }
    });

    console.log(`Payment succeeded: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`Payment failed: ${paymentIntent.id}`);
    // Could add logic here to notify users of failed payments
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
