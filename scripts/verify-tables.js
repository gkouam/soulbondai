const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Verifying database tables...\n')
    
    // Test Account table
    const accountCount = await prisma.account.count()
    console.log(`✅ Account table: ${accountCount} records`)
    
    // Test User table
    const userCount = await prisma.user.count()
    console.log(`✅ User table: ${userCount} records`)
    
    // Test Session table
    const sessionCount = await prisma.session.count()
    console.log(`✅ Session table: ${sessionCount} records`)
    
    console.log('\n✅ All required tables exist!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()