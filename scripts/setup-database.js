const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
    }
  }
})

async function main() {
  try {
    console.log('Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Check if Account table exists
    try {
      const accounts = await prisma.account.count()
      console.log(`✅ Account table exists with ${accounts} records`)
    } catch (error) {
      console.error('❌ Account table does not exist:', error.message)
    }
    
    // Check if User table exists
    try {
      const users = await prisma.user.count()
      console.log(`✅ User table exists with ${users} records`)
    } catch (error) {
      console.error('❌ User table does not exist:', error.message)
    }
    
    console.log('\nIf tables are missing, run: npx prisma db push')
    
  } catch (error) {
    console.error('Database connection error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()