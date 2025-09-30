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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status === 'active') {
      where.isBanned = false
    } else if (status === 'banned') {
      where.isBanned = true
    } else if (status === 'payment_suspended') {
      where.isPaymentSuspended = true
    } else if (status === 'moderator') {
      where.role = 'moderator'
    } else if (status === 'admin') {
      where.role = 'admin'
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        bannedBy: true,
        banReason: true,
        isPaymentSuspended: true,
        paymentFailureCount: true,
        lastPaymentFailure: true,
        paymentSuspendedAt: true,
        createdAt: true,
        _count: {
          select: {
            servers: true,
            pledges: true
          }
        }
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
