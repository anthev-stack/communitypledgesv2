import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(1000, 'Message too long')
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

    const body = await request.json()
    const { content } = createMessageSchema.parse(body)

    const ticketId = params.id

    // Check if ticket exists and user has access
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        createdById: true,
        status: true
      }
    })

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 })
    }

    const isStaff = session.user.role === 'moderator' || session.user.role === 'admin'
    if (!isStaff && ticket.createdById !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    if (ticket.status === 'closed') {
      return NextResponse.json({ message: 'Cannot add messages to closed tickets' }, { status: 400 })
    }

    // Create the message
    const message = await prisma.ticketMessage.create({
      data: {
        content,
        isStaff,
        ticketId,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            name: true,
            image: true
          }
        }
      }
    })

    // Update ticket status if needed
    if (!isStaff && ticket.status === 'resolved') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'open' }
      })
    } else if (isStaff && ticket.status === 'open') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'in_progress' }
      })
    }

    return NextResponse.json(message)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating message:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



