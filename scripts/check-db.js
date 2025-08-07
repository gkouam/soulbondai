const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
    }
  }
})

async function checkDatabase() {
  try {
    console.log('Connecting to database...')
    
    // Check if tables exist by trying to count records
    const tables = [
      { name: 'User', check: () => prisma.user.count() },
      { name: 'Account', check: () => prisma.account.count() },
      { name: 'Session', check: () => prisma.session.count() },
      { name: 'Profile', check: () => prisma.profile.count() },
      { name: 'Subscription', check: () => prisma.subscription.count() },
      { name: 'Message', check: () => prisma.message.count() },
      { name: 'Conversation', check: () => prisma.conversation.count() }
    ]
    
    console.log('\nChecking tables:')
    for (const table of tables) {
      try {
        const count = await table.check()
        console.log(`✅ ${table.name}: ${count} records`)
      } catch (error) {
        console.log(`❌ ${table.name}: ${error.message}`)
      }
    }
    
    console.log('\nDatabase check complete!')
  } catch (error) {
    console.error('Database connection error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()