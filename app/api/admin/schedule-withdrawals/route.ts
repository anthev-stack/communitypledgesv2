import { NextResponse } from 'next/server'
import { scheduleMonthlyWithdrawals, processPendingWithdrawals } from '@/lib/withdrawal'

export async function POST() {
  try {
    // Schedule new withdrawals
    await scheduleMonthlyWithdrawals()
    
    // Process any pending withdrawals that are due today
    await processPendingWithdrawals()
    
    return NextResponse.json({ 
      message: 'Withdrawals scheduled and processed successfully' 
    })
  } catch (error) {
    console.error('Error in withdrawal scheduling:', error)
    return NextResponse.json(
      { message: 'Error scheduling withdrawals' },
      { status: 500 }
    )
  }
}

