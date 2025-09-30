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

    // Check if user has admin permissions (only admins can unban)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Only administrators can unban users' }, { status: 403 })
    }

    const targetUserId = params.id

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    if (!targetUser.isBanned) {
      return NextResponse.json({ message: 'User is not banned' }, { status: 400 })
    }

    // Unban the user
    await prisma.user.update({
      where: { id: targetUserId },
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
        action: 'unban_user',
        reason: 'User unbanned by administrator',
        staffId: session.user.id,
        targetUserId
      }
    })

    // Reactivate all servers owned by the unbanned user (if they have payment methods)
    if (targetUser.hasPaymentMethod) {
      await prisma.server.updateMany({
        where: { ownerId: targetUserId },
        data: { isActive: true }
      })
    }

    return NextResponse.json({ message: 'User unbanned successfully' })
  } catch (error) {
    console.error('Error unbanning user:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



