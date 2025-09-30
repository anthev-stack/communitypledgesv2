import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has staff permissions
    if (session.user.role !== 'moderator' && session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Get dashboard statistics
    const [
      totalUsers,
      bannedUsers,
      totalServers,
      bannedServers,
      openTickets,
      recentTickets,
      recentBans
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.server.count(),
      prisma.server.count({ where: { isBanned: true } }),
      prisma.ticket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.ticket.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              name: true,
              image: true
            }
          },
          assignedTo: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.banAction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          staff: {
            select: {
              name: true
            }
          },
          targetUser: {
            select: {
              name: true
            }
          },
          targetServer: {
            select: {
              name: true
            }
          }
        }
      })
    ])

    return NextResponse.json({
      totalUsers,
      bannedUsers,
      totalServers,
      bannedServers,
      openTickets,
      recentTickets,
      recentBans
    })
  } catch (error) {
    console.error('Error fetching staff dashboard data:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



