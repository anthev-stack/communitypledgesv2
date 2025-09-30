const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function promoteUser() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: node scripts/promote-user.js <email> <role>')
    console.log('Roles: moderator, admin')
    process.exit(1)
  }

  const [email, role] = args

  if (!['moderator', 'admin'].includes(role)) {
    console.log('Invalid role. Must be "moderator" or "admin"')
    process.exit(1)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log(`User with email ${email} not found`)
      process.exit(1)
    }

    await prisma.user.update({
      where: { email },
      data: { role }
    })

    console.log(`Successfully promoted ${user.name || email} to ${role}`)
  } catch (error) {
    console.error('Error promoting user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

promoteUser()



