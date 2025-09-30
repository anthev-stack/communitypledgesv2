import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const banUserSchema = z.object({
  reason: z.string().min(1, 'Ban reason is required').max(500, 'Ban reason must be less than 500 characters')
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
    const { reason } = banUserSchema.parse(body)

    const targetUserId = params.id

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Prevent banning other staff members (only admins can ban moderators)
    if (targetUser.role === 'admin') {
      return NextResponse.json({ message: 'Cannot ban administrators' }, { status: 403 })
    }

    if (targetUser.role === 'moderator' && session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Only administrators can ban moderators' }, { status: 403 })
    }

    // Ban the user
    await prisma.user.update({
      where: { id: targetUserId },
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
        action: 'ban_user',
        reason,
        staffId: session.user.id,
        targetUserId
      }
    })

    // Pause all servers owned by the banned user
    await prisma.server.updateMany({
      where: { ownerId: targetUserId },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'User banned successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error banning user:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



