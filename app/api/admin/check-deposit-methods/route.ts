import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAndPauseAllServersWithoutDepositMethods } from '@/lib/server-pause-utils'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check and pause servers for users without deposit methods
    await checkAndPauseAllServersWithoutDepositMethods()

    return NextResponse.json({ 
      message: 'Successfully checked all users for missing deposit methods'
    })
  } catch (error) {
    console.error('Error checking deposit methods:', error)
    return NextResponse.json(
      { message: 'Error checking deposit methods' },
      { status: 500 }
    )
  }
}
