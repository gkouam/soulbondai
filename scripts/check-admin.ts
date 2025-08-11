import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminSetup() {
  try {
    // Check if kouam7@gmail.com exists and is admin
    const admin = await prisma.user.findUnique({
      where: { email: 'kouam7@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    });

    if (!admin) {
      console.log('❌ Admin user kouam7@gmail.com not found in database');
      console.log('Creating admin user...');
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'kouam7@gmail.com',
          name: 'Admin',
          role: 'ADMIN',
          emailVerified: new Date()
        }
      });
      
      console.log('✅ Admin user created:', newAdmin.email);
    } else if (admin.role !== 'ADMIN') {
      console.log('⚠️ User exists but not admin. Updating role...');
      
      const updated = await prisma.user.update({
        where: { email: 'kouam7@gmail.com' },
        data: { role: 'ADMIN' }
      });
      
      console.log('✅ User role updated to ADMIN');
    } else {
      console.log('✅ Admin user is properly configured:');
      console.log('  Email:', admin.email);
      console.log('  Role:', admin.role);
      console.log('  Created:', admin.createdAt);
    }

    // Count total users
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    console.log('\n📊 Database Stats:');
    console.log('  Total Users:', userCount);
    console.log('  Admin Users:', adminCount);

  } catch (error) {
    console.error('Error checking admin setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminSetup();