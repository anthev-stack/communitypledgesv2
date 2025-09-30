const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixOAuthUsers() {
  try {
    console.log('Fixing OAuth users...')
    
    // Find users without passwords (OAuth users)
    const oauthUsers = await prisma.user.findMany({
      where: {
        password: null
      }
    })
    
    console.log(`Found ${oauthUsers.length} OAuth users`)
    
    for (const user of oauthUsers) {
      console.log(`Fixing user: ${user.email}`)
      
      // Update user with missing fields
      await prisma.user.update({
        where: { id: user.id },
        data: {
          hasPaymentMethod: user.hasPaymentMethod ?? false,
          hasDepositMethod: user.hasDepositMethod ?? false,
          paymentFailureCount: user.paymentFailureCount ?? 0,
          isPaymentSuspended: user.isPaymentSuspended ?? false,
          isBanned: user.isBanned ?? false
        }
      })
      
      console.log(`Fixed user: ${user.email}`)
    }
    
    console.log('OAuth users fixed successfully!')
  } catch (error) {
    console.error('Error fixing OAuth users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixOAuthUsers()

