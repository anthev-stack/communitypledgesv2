import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, this is a simple endpoint that can be called manually
    // In production, you might want to set up a cron job or scheduled task
    
    const now = new Date();
    
    // Find all expired boosts
    const expiredBoosts = await prisma.serverBoost.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: now
        }
      },
      include: {
        server: {
          select: {
            name: true
          }
        }
      }
    });

    // Mark expired boosts as inactive
    const updatedBoosts = await prisma.serverBoost.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: now
        }
      },
      data: {
        isActive: false
      }
    });

    // Log the expiry activity
    for (const boost of expiredBoosts) {
      await prisma.activityLog.create({
        data: {
          type: 'boost_expired',
          message: `Boost expired for server "${boost.server.name}"`,
          amount: boost.amount,
          userId: boost.ownerId,
          serverId: boost.serverId
        }
      });
    }

    return NextResponse.json({
      success: true,
      expiredCount: updatedBoosts.count,
      expiredBoosts: expiredBoosts.map(boost => ({
        id: boost.id,
        serverName: boost.server.name,
        expiresAt: boost.expiresAt
      }))
    });

  } catch (error) {
    console.error('Error expiring boosts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current active boosts count
    const activeBoostsCount = await prisma.serverBoost.count({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    // Get expired boosts count
    const expiredBoostsCount = await prisma.serverBoost.count({
      where: {
        isActive: true,
        expiresAt: {
          lte: new Date()
        }
      }
    });

    return NextResponse.json({
      success: true,
      activeBoosts: activeBoostsCount,
      expiredBoosts: expiredBoostsCount,
      maxBoosts: 10
    });

  } catch (error) {
    console.error('Error fetching boost status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

