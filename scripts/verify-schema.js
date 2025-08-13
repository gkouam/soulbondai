const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
})

async function verifySchema() {
  console.log('Verifying database schema...\n')
  
  try {
    // Test User model
    console.log('Testing User model...')
    const userCount = await prisma.user.count()
    console.log(`✅ User table exists with ${userCount} records`)
    
    // Check for phone column
    const testUser = await prisma.user.findFirst()
    if (testUser) {
      console.log('User columns available:', Object.keys(testUser))
    }
    
    // Test Profile model
    console.log('\nTesting Profile model...')
    const profileCount = await prisma.profile.count()
    console.log(`✅ Profile table exists with ${profileCount} records`)
    
    // Test Subscription model
    console.log('\nTesting Subscription model...')
    const subCount = await prisma.subscription.count()
    console.log(`✅ Subscription table exists with ${subCount} records`)
    
    // Test Conversation model
    console.log('\nTesting Conversation model...')
    const convCount = await prisma.conversation.count()
    console.log(`✅ Conversation table exists with ${convCount} records`)
    
    // Test Message model
    console.log('\nTesting Message model...')
    const msgCount = await prisma.message.count()
    console.log(`✅ Message table exists with ${msgCount} records`)
    
    // Test Memory model
    console.log('\nTesting Memory model...')
    const memCount = await prisma.memory.count()
    console.log(`✅ Memory table exists with ${memCount} records`)
    
    // Test Activity model
    console.log('\nTesting Activity model...')
    const actCount = await prisma.activity.count()
    console.log(`✅ Activity table exists with ${actCount} records`)
    
    // Test ConversionEvent model
    console.log('\nTesting ConversionEvent model...')
    const convEventCount = await prisma.conversionEvent.count()
    console.log(`✅ ConversionEvent table exists with ${convEventCount} records`)
    
    // Test Payment model
    console.log('\nTesting Payment model...')
    const paymentCount = await prisma.payment.count()
    console.log(`✅ Payment table exists with ${paymentCount} records`)
    
    // Test Account model (NextAuth)
    console.log('\nTesting Account model...')
    const accountCount = await prisma.account.count()
    console.log(`✅ Account table exists with ${accountCount} records`)
    
    // Test Session model (NextAuth)
    console.log('\nTesting Session model...')
    const sessionCount = await prisma.session.count()
    console.log(`✅ Session table exists with ${sessionCount} records`)
    
    console.log('\n✅ All database models verified successfully!')
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message)
    if (error.code === 'P2021') {
      console.error('Missing table in database')
    } else if (error.code === 'P2022') {
      console.error('Missing column in database')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifySchema()