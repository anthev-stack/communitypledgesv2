import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can view transactions
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    // Build where clause based on filter
    let whereClause: any = {}
    
    switch (filter) {
      case 'payments':
        whereClause.type = 'payment_processed'
        break
      case 'fees':
        whereClause.type = 'platform_fee'
        break
      case 'boosts':
        whereClause.type = 'server_boost'
        break
      // 'all' - no additional filter
    }

    // Get transactions from activity logs
    const transactions = await prisma.activityLog.findMany({
      where: {
        ...whereClause,
        OR: [
          { type: 'payment_processed' },
          { type: 'platform_fee' },
          { type: 'server_boost' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        server: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to recent 100 transactions
    })

    // Transform transactions for display
    const transformedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount || 0,
      description: transaction.message,
      createdAt: transaction.createdAt.toISOString(),
      user: transaction.user,
      server: transaction.server
    }))

    return NextResponse.json({
      success: true,
      transactions: transformedTransactions
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



