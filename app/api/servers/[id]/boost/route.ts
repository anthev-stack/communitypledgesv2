import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, calculatePlatformFee, calculateStripeFee, calculateNetAmount } from '@/lib/stripe';
import { handlePaymentFailure, isUserPaymentSuspended, resetPaymentFailures } from '@/lib/payment-failure';
import { sendDiscordWebhook, createBoostNotificationEmbed } from '@/lib/discord-webhook';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverId = params.id;

    // Check if server exists and user owns it
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true, ownerId: true, name: true, discordWebhook: true }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'You can only boost your own servers' }, { status: 403 });
    }

    // Check if server already has an active boost
    const existingBoost = await prisma.serverBoost.findFirst({
      where: {
        serverId: serverId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingBoost) {
      return NextResponse.json({ error: 'Server already has an active boost' }, { status: 400 });
    }

    // Check global boost limit (max 10 active boosts)
    const activeBoostsCount = await prisma.serverBoost.count({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (activeBoostsCount >= 10) {
      return NextResponse.json({ error: 'Maximum number of boosted servers reached (10)' }, { status: 400 });
    }

    // Check if user has payment method and get Stripe details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        hasPaymentMethod: true,
        stripePaymentMethodId: true,
        stripeCustomerId: true,
        isPaymentSuspended: true
      }
    });

    if (!user?.hasPaymentMethod || !user?.stripePaymentMethodId || !user?.stripeCustomerId) {
      return NextResponse.json({ error: 'Payment method required to boost server' }, { status: 400 });
    }

    // Check if user is payment suspended
    if (user.isPaymentSuspended) {
      return NextResponse.json({ 
        error: 'Account suspended due to payment failures. Please contact support.' 
      }, { status: 403 });
    }

    // Process immediate payment for boost
    const boostAmount = 3.0;
    const platformFee = calculatePlatformFee(boostAmount);
    const stripeFee = calculateStripeFee(boostAmount);
    const netAmount = calculateNetAmount(boostAmount);

    try {
      // Create and confirm payment intent immediately
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(boostAmount * 100), // Convert to cents
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method: user.stripePaymentMethodId,
        confirm: true,
        application_fee_amount: Math.round(platformFee * 100), // Platform fee in cents
        transfer_data: {
          destination: process.env.STRIPE_CONNECT_ACCOUNT_ID, // Platform's Stripe Connect account
        },
        metadata: {
          serverId: serverId,
          serverOwnerId: session.user.id,
          payerId: session.user.id,
          type: 'boost',
          platformFee: platformFee.toString(),
          stripeFee: stripeFee.toString(),
          netAmount: netAmount.toString()
        }
      });

      if (paymentIntent.status !== 'succeeded') {
        // Handle payment failure
        const failureResult = await handlePaymentFailure(session.user.id, `Boost payment failed: ${paymentIntent.status}`);
        
        let errorMessage = `Payment failed: ${paymentIntent.status}`;
        if (failureResult?.isSuspended) {
          errorMessage = 'Account suspended due to repeated payment failures. Please contact support.';
        } else if (failureResult?.remainingAttempts !== undefined) {
          errorMessage = `Payment failed. ${failureResult.remainingAttempts} attempts remaining before account suspension.`;
        }

        return NextResponse.json({ 
          error: errorMessage,
          failureCount: failureResult?.failureCount,
          remainingAttempts: failureResult?.remainingAttempts
        }, { status: 400 });
      }

      // Create boost record (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const boost = await prisma.serverBoost.create({
        data: {
          serverId: serverId,
          ownerId: session.user.id,
          expiresAt: expiresAt,
          amount: boostAmount,
          isActive: true
        }
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          type: 'server_boost',
          message: `Boosted server "${server.name}" for $${boostAmount.toFixed(2)}`,
          amount: boostAmount,
          userId: session.user.id,
          serverId: serverId
        }
      });

      // Send Discord webhook notification if configured
      if (server.discordWebhook) {
        try {
          const embed = createBoostNotificationEmbed(
            server.name,
            session.user.name || 'Anonymous',
            boostAmount,
            expiresAt
          );

          await sendDiscordWebhook(server.discordWebhook, {
            embeds: [embed]
          });
        } catch (error) {
          console.error('Failed to send Discord webhook notification:', error);
          // Don't fail the boost if webhook fails
        }
      }

      // Log platform fee
      await prisma.activityLog.create({
        data: {
          type: 'platform_fee',
          message: `Platform fee collected: $${platformFee.toFixed(2)}`,
          amount: platformFee,
          userId: session.user.id,
          serverId: serverId
        }
      });

      // Reset payment failures on successful payment
      await resetPaymentFailures(session.user.id);

      return NextResponse.json({
        success: true,
        boost: {
          id: boost.id,
          expiresAt: boost.expiresAt,
          amount: boost.amount
        }
      });

    } catch (error) {
      console.error('Error processing boost payment:', error);
      return NextResponse.json({ 
        error: 'Payment processing failed. Please try again.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error boosting server:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverId = params.id;

    // Get current active boost for this server
    const activeBoost = await prisma.serverBoost.findFirst({
      where: {
        serverId: serverId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      boost: activeBoost ? {
        id: activeBoost.id,
        expiresAt: activeBoost.expiresAt,
        amount: activeBoost.amount,
        isActive: activeBoost.isActive
      } : null
    });

  } catch (error) {
    console.error('Error fetching boost status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

