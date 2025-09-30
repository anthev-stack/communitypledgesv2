import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bankInfoSchema = z.object({
  bankName: z.string().min(2, 'Bank name is required'),
  accountNumber: z.string().min(8, 'Account number must be at least 8 digits'),
  routingNumber: z.string().length(9, 'Routing number must be 9 digits'),
  accountHolderName: z.string().min(2, 'Account holder name is required')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can view banking information
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get platform banking information
    const bankInfo = await prisma.platformBanking.findFirst({
      select: {
        id: true,
        bankName: true,
        accountNumber: true,
        routingNumber: true,
        accountHolderName: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (bankInfo) {
      // Mask account number for display
      const maskedAccountNumber = bankInfo.accountNumber.slice(-4)
      return NextResponse.json({
        success: true,
        bankInfo: {
          ...bankInfo,
          accountLast4: maskedAccountNumber,
          accountNumber: bankInfo.accountNumber // Keep full number for updates
        }
      })
    }

    return NextResponse.json({
      success: true,
      bankInfo: null
    })
  } catch (error) {
    console.error('Error fetching banking info:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can manage banking information
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bankName, accountNumber, routingNumber, accountHolderName } = bankInfoSchema.parse(body)

    // Check if banking info already exists
    const existingBankInfo = await prisma.platformBanking.findFirst()

    if (existingBankInfo) {
      // Update existing banking info
      const updatedBankInfo = await prisma.platformBanking.update({
        where: { id: existingBankInfo.id },
        data: {
          bankName,
          accountNumber,
          routingNumber,
          accountHolderName,
          updatedAt: new Date()
        },
        select: {
          id: true,
          bankName: true,
          accountNumber: true,
          routingNumber: true,
          accountHolderName: true,
          createdAt: true,
          updatedAt: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Banking information updated successfully',
        bankInfo: {
          ...updatedBankInfo,
          accountLast4: updatedBankInfo.accountNumber.slice(-4)
        }
      })
    } else {
      // Create new banking info
      const newBankInfo = await prisma.platformBanking.create({
        data: {
          bankName,
          accountNumber,
          routingNumber,
          accountHolderName
        },
        select: {
          id: true,
          bankName: true,
          accountNumber: true,
          routingNumber: true,
          accountHolderName: true,
          createdAt: true,
          updatedAt: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Banking information created successfully',
        bankInfo: {
          ...newBankInfo,
          accountLast4: newBankInfo.accountNumber.slice(-4)
        }
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving banking info:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



