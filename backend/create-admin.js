const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔑 Creating admin user...');
    
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@seatsnags.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@seatsnags.com');
    console.log('🔑 Password: admin123');
    console.log('🎯 Role: ADMIN');
    
    // Also create sample buyer and seller
    const buyerPassword = await bcrypt.hash('buyer123', 12);
    await prisma.user.create({
      data: {
        email: 'buyer@seatsnags.com',
        password: buyerPassword,
        firstName: 'John',
        lastName: 'Buyer',
        role: 'BUYER',
        isEmailVerified: true,
        isActive: true,
      },
    });

    const sellerPassword = await bcrypt.hash('seller123', 12);
    await prisma.user.create({
      data: {
        email: 'seller@seatsnags.com',
        password: sellerPassword,
        firstName: 'Jane',
        lastName: 'Seller',
        role: 'SELLER',
        isEmailVerified: true,
        isActive: true,
      },
    });

    console.log('✅ Sample users also created:');
    console.log('🛒 Buyer: buyer@seatsnags.com / buyer123');
    console.log('💰 Seller: seller@seatsnags.com / seller123');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email: admin@seatsnags.com');
      console.log('🔑 Password: admin123');
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();