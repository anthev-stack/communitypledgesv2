import { prisma } from './prisma'
import { stripe } from './stripe'

/**
 * Checks if a user has a valid deposit method and pauses their servers if they don't
 */
export async function checkAndPauseServersForUser(userId: string) {
  try {
    // Get user's deposit method status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        stripeAccountId: true, 
        hasDepositMethod: true 
      }
    })

    if (!user) return

    let hasValidDepositMethod = false

    // Check if user has a Stripe Connect account
    if (user.stripeAccountId) {
      try {
        // Verify the account still exists in Stripe
        await stripe.accounts.retrieve(user.stripeAccountId)
        hasValidDepositMethod = true
      } catch (error) {
        // Account doesn't exist in Stripe, clear it from our database
        console.log(`Stripe Connect account not found for user ${userId}, clearing from database`)
        await prisma.user.update({
          where: { id: userId },
          data: { stripeAccountId: null, hasDepositMethod: false }
        })
        hasValidDepositMethod = false
      }
    }

    // If user doesn't have a valid deposit method, pause their servers
    if (!hasValidDepositMethod) {
      const userServers = await prisma.server.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true, isActive: true }
      })

      // Only pause servers that are currently active
      const activeServers = userServers.filter(server => server.isActive)
      
      if (activeServers.length > 0) {
        await prisma.server.updateMany({
          where: { 
            ownerId: userId,
            isActive: true 
          },
          data: { isActive: false }
        })

        // Log server pause activities
        for (const server of activeServers) {
          await prisma.activityLog.create({
            data: {
              type: 'server_paused',
              message: `Your server "${server.name}" has been paused due to missing deposit method`,
              userId: userId,
              serverId: server.id
            }
          })
        }

        console.log(`Paused ${activeServers.length} servers for user ${userId} due to missing deposit method`)
      }
    }
  } catch (error) {
    console.error('Error checking and pausing servers for user:', error)
  }
}

/**
 * Checks all users and pauses servers for those without valid deposit methods
 */
export async function checkAndPauseAllServersWithoutDepositMethods() {
  try {
    console.log('Checking all users for missing deposit methods...')
    
    // Get all users who have servers
    const usersWithServers = await prisma.user.findMany({
      where: {
        servers: {
          some: {}
        }
      },
      select: { id: true }
    })

    console.log(`Found ${usersWithServers.length} users with servers`)

    // Check each user
    for (const user of usersWithServers) {
      await checkAndPauseServersForUser(user.id)
    }

    console.log('Finished checking all users for missing deposit methods')
  } catch (error) {
    console.error('Error checking all users for missing deposit methods:', error)
  }
}


