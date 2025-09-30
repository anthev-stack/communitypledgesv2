import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const banServerSchema = z.object({
  reason: z.string().min(1, 'Ban reason is required')
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has staff permissions
    if (session.user.role !== 'moderator' && session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { reason } = banServerSchema.parse(body)

    const serverId = params.id

    // Check if server exists
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { owner: true }
    })

    if (!server) {
      return NextResponse.json({ message: 'Server not found' }, { status: 404 })
    }

    // Ban the server
    const bannedServer = await prisma.server.update({
      where: { id: serverId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedBy: session.user.id,
        banReason: reason
      }
    })

    // Log the ban action
    await prisma.banAction.create({
      data: {
        action: 'server_ban',
        reason,
        staffId: session.user.id,
        targetServerId: serverId
      }
    })

    return NextResponse.json(bannedServer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error banning server:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



