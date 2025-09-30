import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can unban servers
    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const serverId = params.id

    // Check if server exists
    const server = await prisma.server.findUnique({
      where: { id: serverId }
    })

    if (!server) {
      return NextResponse.json({ message: 'Server not found' }, { status: 404 })
    }

    // Unban the server
    const unbannedServer = await prisma.server.update({
      where: { id: serverId },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedBy: null,
        banReason: null
      }
    })

    // Log the unban action
    await prisma.banAction.create({
      data: {
        action: 'server_unban',
        reason: 'Server unbanned by admin',
        staffId: session.user.id,
        targetServerId: serverId
      }
    })

    return NextResponse.json(unbannedServer)
  } catch (error) {
    console.error('Error unbanning server:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



