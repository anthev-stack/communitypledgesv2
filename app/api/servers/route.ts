import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'


const createServerSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  cost: z.number().min(15).max(80),
  withdrawalDay: z.number().min(1).max(31),
  gameType: z.string().min(1, 'Game type is required'),
  region: z.string().min(1, 'Region is required'),
  tags: z.string().min(1, 'At least 3 tags are required'),
  bannerUrl: z.string().url().optional().nullable(),
  serverIp: z.string().min(1, 'Server IP or domain is required'),
  serverPort: z.number().min(1).max(65535).optional().nullable(),
  discordChannel: z.string().url().optional().nullable(),
  discordWebhook: z.string()
    .url('Invalid Discord webhook URL')
    .refine((url) => {
      if (!url) return true; // Allow empty
      return url.includes('discord.com/api/webhooks/') || url.includes('discordapp.com/api/webhooks/');
    }, 'Invalid Discord webhook URL format')
    .optional()
    .nullable()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get('gameType');
    const region = searchParams.get('region');
    const sortBy = searchParams.get('sortBy') || 'default';
    
    const servers = await prisma.server.findMany({
      where: {
        isActive: true,
        ...(gameType && { gameType }),
        ...(region && { region })
      },
      include: {
        owner: {
          select: {
            name: true,
            image: true
          }
        },
        pledges: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            pledges: true,
            favorites: true
          }
        },
        serverBoosts: {
          where: {
            isActive: true,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get user's favorites if logged in
    let userFavorites: string[] = [];
    if (session?.user?.id) {
      const favorites = await prisma.favorite.findMany({
        where: { userId: session.user.id },
        select: { serverId: true }
      });
      userFavorites = favorites.map(f => f.serverId);
    }

    // Simplify server data for browser view
    const serversWithPricing = servers.map(server => {
      const totalPledged = server.pledges.reduce((sum, pledge) => sum + pledge.amount, 0)
      const pledgeCount = server.pledges.length
      const minCostPerPerson = 2.0
      
      // Simple check for accepting pledges
      const maxPeople = Math.floor(server.cost / minCostPerPerson)
      const isAcceptingPledges = pledgeCount < maxPeople && totalPledged < server.cost

      // Check if server has active boost
      const hasActiveBoost = server.serverBoosts.length > 0;

      return {
        ...server,
        isAcceptingPledges,
        isFavorited: userFavorites.includes(server.id),
        hasActiveBoost,
        boostExpiresAt: hasActiveBoost ? server.serverBoosts[0].expiresAt : null
      }
    })

    // Sort servers based on sortBy parameter
    const sortedServers = serversWithPricing.sort((a, b) => {
      switch (sortBy) {
        case 'favorites_high':
          return b._count.favorites - a._count.favorites;
        case 'favorites_low':
          return a._count.favorites - b._count.favorites;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'pledges_high':
          return b._count.pledges - a._count.pledges;
        case 'pledges_low':
          return a._count.pledges - b._count.pledges;
        default: // 'default' - original sorting logic
          // First priority: User's favorites
          if (a.isFavorited && !b.isFavorited) return -1;
          if (!a.isFavorited && b.isFavorited) return 1;
          
          // Second priority: Boosted servers (by boost creation time)
          if (a.hasActiveBoost && !b.hasActiveBoost) return -1;
          if (!a.hasActiveBoost && b.hasActiveBoost) return 1;
          if (a.hasActiveBoost && b.hasActiveBoost) {
            return new Date(a.boostExpiresAt).getTime() - new Date(b.boostExpiresAt).getTime();
          }
          
          // Third priority: Regular servers by creation time
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return NextResponse.json(sortedServers)
  } catch (error) {
    console.error('Error fetching servers:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has deposit method
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hasDepositMethod: true }
    })

    if (!user?.hasDepositMethod) {
      return NextResponse.json(
        { message: 'Deposit method required. Please add a deposit method in your settings to create servers.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, cost, withdrawalDay, gameType, region, tags, bannerUrl, serverIp, serverPort, discordChannel, discordWebhook } = createServerSchema.parse(body)

    // Set default port based on game type if not provided
    let finalPort = serverPort
    if (!finalPort && serverIp) {
      if (gameType.toLowerCase() === 'minecraft') {
        finalPort = 25565
      } else if (gameType.toLowerCase().includes('counter-strike') || gameType.toLowerCase().includes('cs2')) {
        finalPort = 27015
      } else if (gameType.toLowerCase() === 'rust') {
        finalPort = 28015
      } else if (gameType.toLowerCase() === 'ark') {
        finalPort = 27015
      } else {
        finalPort = 27015 // Default for most games
      }
    }

    const server = await prisma.server.create({
      data: {
        name,
        description,
        cost,
        withdrawalDay,
        gameType,
        region,
        tags,
        bannerUrl,
        serverIp,
        serverPort: finalPort,
        discordChannel,
        discordWebhook,
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: {
            name: true,
            image: true
          }
        }
      }
    })

    // Log server creation activity
    await prisma.activityLog.create({
      data: {
        type: 'server_created',
        message: `You created server "${name}"`,
        userId: session.user.id,
        serverId: server.id
      }
    })

    return NextResponse.json(server, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating server:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('id')

    if (!serverId) {
      return NextResponse.json(
        { message: 'Server ID is required' },
        { status: 400 }
      )
    }

    // Check if server exists and user owns it
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true, name: true, ownerId: true, pledges: { select: { userId: true, user: { select: { name: true } } } } }
    })

    if (!server) {
      return NextResponse.json(
        { message: 'Server not found' },
        { status: 404 }
      )
    }

    if (server.ownerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Unauthorized to delete this server' },
        { status: 403 }
      )
    }

    // Notify all pledgers about server deletion
    for (const pledge of server.pledges) {
      await prisma.activityLog.create({
        data: {
          type: 'server_deleted',
          message: `Server "${server.name}" has been deleted by the owner. Your pledge has been cancelled.`,
          userId: pledge.userId,
          serverId: serverId
        }
      })
    }

    // Delete the server (this will cascade delete pledges, activities, etc.)
    await prisma.server.delete({
      where: { id: serverId }
    })

    // Log deletion activity for the owner
    await prisma.activityLog.create({
      data: {
        type: 'server_deleted',
        message: `You deleted server "${server.name}"`,
        userId: session.user.id,
        serverId: serverId
      }
    })

    return NextResponse.json({ message: 'Server deleted successfully' })
  } catch (error) {
    console.error('Error deleting server:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
