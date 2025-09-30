import { NextRequest, NextResponse } from 'next/server'
import { processPendingWithdrawals, scheduleMonthlyWithdrawals } from '@/lib/withdrawal'

/**
 * Cron job endpoint to process monthly withdrawals
 * This should be called by a cron service like Vercel Cron, GitHub Actions, or similar
 * 
 * Schedule: Run daily at 2 AM UTC to check for withdrawals due that day
 * Example cron expression: "0 2 * * *"
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (optional security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting monthly withdrawal processing...')
    
    // First, schedule any new withdrawals for servers that need them
    await scheduleMonthlyWithdrawals()
    console.log('Scheduled new monthly withdrawals')
    
    // Then, process any withdrawals that are due today
    await processPendingWithdrawals()
    console.log('Processed pending withdrawals')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal processing completed',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in withdrawal processing cron job:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Withdrawal processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// Allow GET requests for testing
export async function GET() {
  try {
    console.log('Manual withdrawal processing triggered...')
    
    await scheduleMonthlyWithdrawals()
    await processPendingWithdrawals()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Manual withdrawal processing completed',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in manual withdrawal processing:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Manual withdrawal processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}


