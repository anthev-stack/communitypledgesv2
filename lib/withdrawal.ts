import { prisma } from './prisma'
import { stripe, calculatePlatformFee, calculateStripeFee, calculateNetAmount } from './stripe'
import { handlePaymentFailure, resetPaymentFailures } from './payment-failure'

/**
 * Calculate the next withdrawal date for a server based on its withdrawal day
 * Withdrawals are scheduled 2 days before the server's due date
 */
export function calculateNextWithdrawalDate(withdrawalDay: number): Date {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Calculate the due date for this month
  let dueDate = new Date(currentYear, currentMonth, withdrawalDay)
  
  // If the due date has already passed this month, use next month
  if (dueDate <= now) {
    dueDate = new Date(currentYear, currentMonth + 1, withdrawalDay)
  }
  
  // Calculate withdrawal date (2 days before due date)
  const withdrawalDate = new Date(dueDate)
  withdrawalDate.setDate(dueDate.getDate() - 2)
  
  return withdrawalDate
}

/**
 * Calculate the next withdrawal date for a specific server
 * This takes into account the server's specific withdrawal day
 */
export function calculateServerWithdrawalDate(serverWithdrawalDay: number): Date {
  return calculateNextWithdrawalDate(serverWithdrawalDay)
}

/**
 * Schedule monthly withdrawals for all active servers
 * This should be called by a cron job or scheduled task
 */
export async function scheduleMonthlyWithdrawals() {
  try {
    const activeServers = await prisma.server.findMany({
      where: {
        isActive: true
      },
      include: {
        pledges: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    for (const server of activeServers) {
      const nextWithdrawalDate = calculateServerWithdrawalDate(server.withdrawalDay)
      
      // Check if withdrawal is already scheduled for this month
      const existingWithdrawal = await prisma.withdrawal.findFirst({
        where: {
          serverId: server.id,
          scheduledDate: {
            gte: new Date(nextWithdrawalDate.getFullYear(), nextWithdrawalDate.getMonth(), 1),
            lt: new Date(nextWithdrawalDate.getFullYear(), nextWithdrawalDate.getMonth() + 1, 1)
          }
        }
      })

      if (!existingWithdrawal && server.pledges.length > 0) {
        // Calculate total amount to withdraw based on optimized costs
        const pledgeAmounts = server.pledges.map(p => p.amount)
        const optimizedCosts = calculateOptimizedCosts(pledgeAmounts, server.cost, 2.0)
        const totalWithdrawalAmount = optimizedCosts.optimizedCosts.reduce((sum, cost) => sum + cost, 0)

        await prisma.withdrawal.create({
          data: {
            serverId: server.id,
            amount: totalWithdrawalAmount,
            scheduledDate: nextWithdrawalDate,
            status: 'pending'
          }
        })

        console.log(`Scheduled withdrawal for server ${server.name}: $${totalWithdrawalAmount.toFixed(2)} on ${nextWithdrawalDate.toISOString()}`)
      }
    }
  } catch (error) {
    console.error('Error scheduling monthly withdrawals:', error)
    throw error
  }
}

/**
 * Process pending withdrawals (mark as completed)
 * This should be called by a cron job on the scheduled withdrawal dates
 */
export async function processPendingWithdrawals() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        status: 'pending',
        scheduledDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        server: {
          include: {
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    for (const withdrawal of pendingWithdrawals) {
      // Get server with pledges to calculate individual payments
      const server = await prisma.server.findUnique({
        where: { id: withdrawal.serverId },
        include: {
          pledges: {
            include: {
              user: {
                select: {
                  name: true,
                  stripeAccountId: true
                }
              }
            }
          },
          user: {
            select: {
              stripeAccountId: true
            }
          }
        }
      })

      if (!server) continue

      // Calculate optimized costs for each pledger
      const pledgeAmounts = server.pledges.map(p => p.amount)
      const optimizedCosts = calculateOptimizedCosts(pledgeAmounts, server.cost, 2.0)
      
      // Process payments for each pledger
      let totalCollected = 0
      let successfulPayments = 0
      
      for (let i = 0; i < server.pledges.length; i++) {
        const pledge = server.pledges[i]
        const actualAmount = optimizedCosts.optimizedCosts[i] || pledge.amount
        
        try {
          // Get user's payment method
          const user = await prisma.user.findUnique({
            where: { id: pledge.userId },
            select: { 
              stripePaymentMethodId: true, 
              stripeCustomerId: true,
              name: true
            }
          })

          if (!user?.stripePaymentMethodId || !user?.stripeCustomerId) {
            console.log(`User ${pledge.userId} has no payment method, skipping payment`)
            continue
          }

          // Calculate fees for this payment
          const platformFee = calculatePlatformFee(actualAmount)
          const stripeFee = calculateStripeFee(actualAmount)
          const netAmount = calculateNetAmount(actualAmount)

          // Create payment intent for this user
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(actualAmount * 100), // Convert to cents
            currency: 'usd',
            customer: user.stripeCustomerId,
            payment_method: user.stripePaymentMethodId,
            confirm: true,
            application_fee_amount: Math.round(platformFee * 100), // Platform fee in cents
            transfer_data: server.user.stripeAccountId ? {
              destination: server.user.stripeAccountId, // Server owner's Stripe Connect account
            } : undefined,
            metadata: {
              serverId: withdrawal.serverId,
              serverOwnerId: withdrawal.server.ownerId,
              payerId: pledge.userId,
              type: 'pledge_payment',
              platformFee: platformFee.toString(),
              stripeFee: stripeFee.toString(),
              netAmount: netAmount.toString()
            }
          })

          if (paymentIntent.status === 'succeeded') {
            totalCollected += actualAmount
            successfulPayments++
            
            // Reset payment failures on successful payment
            await resetPaymentFailures(pledge.userId)
            
            // Log successful payment
            await prisma.activityLog.create({
              data: {
                type: 'payment_processed',
                message: `Payment of $${actualAmount.toFixed(2)} processed for "${server.name}" pledge`,
                amount: actualAmount,
                userId: pledge.userId,
                serverId: withdrawal.serverId
              }
            })
          } else {
            console.log(`Payment failed for user ${pledge.userId}: ${paymentIntent.status}`)
            
            // Handle payment failure
            const failureResult = await handlePaymentFailure(pledge.userId, `Pledge payment failed: ${paymentIntent.status}`)
            
            if (failureResult?.isSuspended) {
              console.log(`User ${pledge.userId} suspended due to payment failures`)
            } else {
              console.log(`User ${pledge.userId} has ${failureResult?.remainingAttempts} payment attempts remaining`)
            }
          }
        } catch (error) {
          console.error(`Error processing payment for user ${pledge.userId}:`, error)
        }
      }

      // Update withdrawal status
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: 'completed',
          processedAt: new Date(),
          actualAmount: totalCollected
        }
      })

      console.log(`Processed withdrawal for server ${withdrawal.server.name}: $${totalCollected.toFixed(2)} (${successfulPayments}/${server.pledges.length} payments successful)`)
      
      // Log deposit activity for server owner
      if (totalCollected > 0) {
        await prisma.activityLog.create({
          data: {
            type: 'deposit_received',
            message: `You received $${totalCollected.toFixed(2)} from community pledges for "${withdrawal.server.name}"`,
            amount: totalCollected,
            userId: withdrawal.server.ownerId,
            serverId: withdrawal.serverId
          }
        })
      }
      
      // TODO: Send notification to server owner about successful withdrawal
      // TODO: Send notification to pledgers about their payment being processed
    }
  } catch (error) {
    console.error('Error processing pending withdrawals:', error)
    throw error
  }
}

/**
 * Calculate optimized costs for withdrawal amount
 * This is a simplified version of the main algorithm
 */
function calculateOptimizedCosts(pledgeAmounts: number[], serverCost: number, minCostPerPerson: number) {
  const totalPledged = pledgeAmounts.reduce((sum, amount) => sum + amount, 0)
  const pledgeCount = pledgeAmounts.length
  
  if (pledgeCount === 0) {
    return { optimizedCosts: [] }
  }
  
  if (totalPledged < serverCost) {
    return { optimizedCosts: pledgeAmounts }
  }
  
  // If total pledged >= server cost, optimize distribution
  let optimizedCosts = [...pledgeAmounts]
  let excess = totalPledged - serverCost
  
  // Create array of indices sorted by pledge amount (highest first)
  const sortedIndices = pledgeAmounts
    .map((amount, index) => ({ amount, index }))
    .sort((a, b) => b.amount - a.amount)
    .map(item => item.index)
  
  // Phase 1: Balance among top pledgers
  for (let i = 0; i < sortedIndices.length - 1 && excess > 0; i++) {
    const currentIndex = sortedIndices[i]
    const nextIndex = sortedIndices[i + 1]
    
    const currentCost = optimizedCosts[currentIndex]
    const nextCost = optimizedCosts[nextIndex]
    
    if (currentCost > nextCost) {
      const difference = currentCost - nextCost
      const reduction = Math.min(excess, difference)
      
      optimizedCosts[currentIndex] = currentCost - reduction
      excess -= reduction
    }
  }
  
  // Phase 2: Distribute remaining excess
  for (const index of sortedIndices) {
    if (excess <= 0) break
    
    const currentCost = optimizedCosts[index]
    const maxReduction = currentCost - minCostPerPerson
    
    if (maxReduction > 0) {
      const reduction = Math.min(excess, maxReduction)
      optimizedCosts[index] = currentCost - reduction
      excess -= reduction
    }
  }
  
  return { optimizedCosts }
}
