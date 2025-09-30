const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearOAuthAccounts() {
  try {
    console.log('Clearing OAuth accounts...')
    
    // Delete all OAuth accounts
    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        type: 'oauth'
      }
    })
    
    console.log(`Deleted ${deletedAccounts.count} OAuth accounts`)
    
    // Also delete any users that might have been created without proper linking
    const usersWithoutAccounts = await prisma.user.findMany({
      where: {
        accounts: {
          none: {}
        }
      }
    })
    
    console.log(`Found ${usersWithoutAccounts.length} users without accounts`)
    
    // Delete users without any accounts (OAuth users that weren't properly linked)
    for (const user of usersWithoutAccounts) {
      if (!user.password) { // Only delete OAuth users (no password)
        await prisma.user.delete({
          where: { id: user.id }
        })
        console.log(`Deleted user: ${user.email}`)
      }
    }
    
    console.log('OAuth accounts cleared successfully!')
  } catch (error) {
    console.error('Error clearing OAuth accounts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearOAuthAccounts()

