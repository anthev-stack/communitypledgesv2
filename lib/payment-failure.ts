import { prisma } from './prisma'

const MAX_PAYMENT_FAILURES = 3

/**
 * Handle payment failure for a user
 * Increments failure count and suspends account if threshold is reached
 */
export async function handlePaymentFailure(userId: string, error: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        paymentFailureCount: true, 
        isPaymentSuspended: true,
        name: true
      }
    })

    if (!user) {
      console.error(`User ${userId} not found for payment failure handling`)
      return
    }

    // If already suspended, don't increment further
    if (user.isPaymentSuspended) {
      return
    }

    const newFailureCount = user.paymentFailureCount + 1
    const shouldSuspend = newFailureCount >= MAX_PAYMENT_FAILURES

    // Update user with new failure count
    await prisma.user.update({
      where: { id: userId },
      data: {
        paymentFailureCount: newFailureCount,
        lastPaymentFailure: new Date(),
        isPaymentSuspended: shouldSuspend,
        paymentSuspendedAt: shouldSuspend ? new Date() : null
      }
    })

    if (shouldSuspend) {
      console.log(`User ${user.name} (${userId}) suspended due to ${newFailureCount} payment failures`)
      
      // Remove user from all active pledges
      await removeUserFromAllPledges(userId)
      
      // Log suspension activity
      await prisma.activityLog.create({
        data: {
          type: 'account_suspended',
          message: `Account suspended due to ${newFailureCount} consecutive payment failures`,
          userId: userId
        }
      })
    } else {
      // Log payment failure
      await prisma.activityLog.create({
        data: {
          type: 'payment_failed',
          message: `Payment failed (${newFailureCount}/${MAX_PAYMENT_FAILURES}): ${error}`,
          userId: userId
        }
      })
    }

    return {
      failureCount: newFailureCount,
      isSuspended: shouldSuspend,
      remainingAttempts: MAX_PAYMENT_FAILURES - newFailureCount
    }
  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

/**
 * Remove user from all active pledges when account is suspended
 */
async function removeUserFromAllPledges(userId: string) {
  try {
    // Get all active pledges for this user
    const userPledges = await prisma.pledge.findMany({
      where: {
        userId: userId,
        status: 'active'
      },
      include: {
        server: {
          select: {
            name: true
          }
        }
      }
    })

    // Remove each pledge
    for (const pledge of userPledges) {
      await prisma.pledge.delete({
        where: { id: pledge.id }
      })

      // Log unpledge activity
      await prisma.activityLog.create({
        data: {
          type: 'unpledge',
          message: `Removed from "${pledge.server.name}" due to account suspension`,
          userId: userId,
          serverId: pledge.serverId
        }
      })

      // Update server pledge count
      await prisma.server.update({
        where: { id: pledge.serverId },
        data: {
          currentPledges: {
            decrement: 1
          }
        }
      })
    }

    console.log(`Removed user ${userId} from ${userPledges.length} active pledges`)
  } catch (error) {
    console.error('Error removing user from pledges:', error)
    throw error
  }
}

/**
 * Reset payment failure count for a user (e.g., after successful payment)
 */
export async function resetPaymentFailures(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        paymentFailureCount: 0,
        lastPaymentFailure: null,
        isPaymentSuspended: false,
        paymentSuspendedAt: null
      }
    })

    console.log(`Reset payment failures for user ${userId}`)
  } catch (error) {
    console.error('Error resetting payment failures:', error)
    throw error
  }
}

/**
 * Check if user is payment suspended
 */
export async function isUserPaymentSuspended(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPaymentSuspended: true }
    })

    return user?.isPaymentSuspended || false
  } catch (error) {
    console.error('Error checking payment suspension status:', error)
    return false
  }
}

/**
 * Get user's payment failure status
 */
export async function getUserPaymentStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        paymentFailureCount: true,
        lastPaymentFailure: true,
        isPaymentSuspended: true,
        paymentSuspendedAt: true
      }
    })

    if (!user) {
      return null
    }

    return {
      failureCount: user.paymentFailureCount,
      lastFailure: user.lastPaymentFailure,
      isSuspended: user.isPaymentSuspended,
      suspendedAt: user.paymentSuspendedAt,
      remainingAttempts: MAX_PAYMENT_FAILURES - user.paymentFailureCount
    }
  } catch (error) {
    console.error('Error getting user payment status:', error)
    return null
  }
}


