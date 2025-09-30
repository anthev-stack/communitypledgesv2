const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log('🌱 Seeding default admin account...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin account already exists:', existingAdmin.email);
      return;
    }

    // Create default admin account
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@communitypledges.com',
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date(),
        image: '/default-avatar.png'
      }
    });

    console.log('✅ Default admin account created successfully!');
    console.log('📧 Email: admin@communitypledges.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  IMPORTANT: Change this password after first login!');

  } catch (error) {
    console.error('❌ Error seeding admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();


