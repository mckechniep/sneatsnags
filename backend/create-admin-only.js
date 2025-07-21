const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminOnly() {
  try {
    console.log('🔑 Creating admin user...');
    
    // You can customize these values
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@seatsnags.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'User';
    
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('🎯 Role: ADMIN');
    console.log('🚀 You can now login to the admin panel!');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${process.env.ADMIN_EMAIL || 'admin@seatsnags.com'}`);
      console.log('🔑 Use your existing password or reset it through the app');
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminOnly();