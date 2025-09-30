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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or moderator
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!currentUser || !['admin', 'moderator'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const userId = params.id

    // Check if user exists and is payment suspended
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        isPaymentSuspended: true,
        paymentFailureCount: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.isPaymentSuspended) {
      return NextResponse.json({ error: 'User is not payment suspended' }, { status: 400 })
    }

    // Unsuspend the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPaymentSuspended: false,
        paymentSuspendedAt: null,
        paymentFailureCount: 0,
        lastPaymentFailure: null
      }
    })

    // Log the unsuspend action
    await prisma.activityLog.create({
      data: {
        type: 'account_unsuspended',
        message: `Payment suspension lifted by ${currentUser.role}`,
        userId: userId
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `User ${user.name} has been unsuspended` 
    })

  } catch (error) {
    console.error('Error unsuspending user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


