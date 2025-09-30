import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Get user profile with detailed stats
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        servers: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            name: true,
            description: true,
            gameType: true,
            cost: true,
            bannerUrl: true,
            createdAt: true,
            pledges: {
              select: {
                amount: true,
                user: {
                  select: {
                    name: true
                  }
                }
              }
            },
            _count: {
              select: {
                pledges: true
              }
            }
          }
        },
        pledges: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
            server: {
              select: {
                id: true,
                name: true,
                gameType: true,
                cost: true,
                bannerUrl: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate basic stats only
    const totalServerCost = user.servers.reduce((sum, server) => sum + server.cost, 0);

    // Transform servers data
    const serversWithStats = user.servers.map(server => ({
      id: server.id,
      name: server.name,
      description: server.description,
      gameType: server.gameType,
      cost: server.cost,
      bannerUrl: server.bannerUrl,
      createdAt: server.createdAt.toISOString(),
      pledgeCount: server._count.pledges
    }));

    // Transform pledges data (simplified)
    const pledgesWithServerInfo = user.pledges.map(pledge => ({
      id: pledge.id,
      amount: pledge.amount,
      createdAt: pledge.createdAt.toISOString(),
      server: pledge.server
    }));

    const userProfile = {
      id: user.id,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      stats: {
        serverCount: user.servers.length,
        pledgeCount: user.pledges.length,
        totalServerCost
      },
      servers: serversWithStats,
      pledges: pledgesWithServerInfo
    };

    return NextResponse.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
