import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const promoteUserSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin'])
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

    // Only admins can promote/demote users
    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { role } = promoteUserSchema.parse(body)

    const userId = params.id

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Prevent self-demotion
    if (user.id === session.user.id) {
      return NextResponse.json({ 
        message: 'You cannot change your own role' 
      }, { status: 400 })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    })

    return NextResponse.json({
      message: `User ${role === 'user' ? 'demoted' : 'promoted'} successfully`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error promoting user:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



