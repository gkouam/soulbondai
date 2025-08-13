const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  console.log('Testing database connection...\n')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
      }
    }
  })
  
  try {
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful!')
    
    // Test User table with phone column
    console.log('\nTesting User table with phone column...')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        phoneNumber: true,
        phoneVerified: true
      },
      take: 1
    })
    
    if (users.length > 0) {
      console.log('✅ User table accessible with phone columns')
      console.log('Sample user columns:', Object.keys(users[0]))
    } else {
      console.log('✅ User table accessible (no users found)')
    }
    
    // Test creating a user with phone field
    console.log('\nTesting user creation with phone field...')
    const testEmail = `test-${Date.now()}@example.com`
    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        phone: '+1234567890',
        phoneNumber: '+1234567890',
        phoneVerified: false
      }
    })
    console.log('✅ Successfully created user with phone fields')
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: newUser.id }
    })
    console.log('✅ Cleaned up test user')
    
    console.log('\n🎉 All database tests passed successfully!')
    console.log('The database schema has been fixed and is working correctly.')
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    if (error.code === 'P2002') {
      console.error('Unique constraint violation')
    } else if (error.code === 'P2025') {
      console.error('Record not found')
    } else if (error.meta?.column) {
      console.error('Missing column:', error.meta.column)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()