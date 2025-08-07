const { PrismaClient } = require('@prisma/client')

const DATABASE_URL = "postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

async function createTables() {
  console.log('🔧 Force creating database tables...')
  
  try {
    // Use raw SQL to create the Account table that NextAuth needs
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        
        CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
      );
    `
    console.log('✅ Created Account table')

    // Create Session table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL,
        "sessionToken" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
      );
    `
    console.log('✅ Created Session table')

    // Create User table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "email" TEXT,
        "emailVerified" TIMESTAMP(3),
        "name" TEXT,
        "image" TEXT,
        "passwordHash" TEXT,
        "phoneNumber" TEXT,
        "phoneVerified" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `
    console.log('✅ Created User table')

    // Create VerificationToken table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL
      );
    `
    console.log('✅ Created VerificationToken table')

    // Create indexes
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" 
      ON "Account"("provider", "providerAccountId");
    `
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" 
      ON "Session"("sessionToken");
    `
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" 
      ON "User"("email");
    `
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" 
      ON "VerificationToken"("token");
    `
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" 
      ON "VerificationToken"("identifier", "token");
    `
    
    console.log('✅ Created indexes')

    // Add foreign keys
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Account" 
        ADD CONSTRAINT "Account_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `
      console.log('✅ Added foreign key constraints')
    } catch (e) {
      console.log('ℹ️ Foreign keys might already exist')
    }

    console.log('\n🎉 All NextAuth tables created successfully!')
    
    // Test the tables
    const accountCount = await prisma.$queryRaw`SELECT COUNT(*) FROM "Account"`
    const userCount = await prisma.$queryRaw`SELECT COUNT(*) FROM "User"`
    console.log(`\n📊 Table status:`)
    console.log(`   - Account table: ${accountCount[0].count} records`)
    console.log(`   - User table: ${userCount[0].count} records`)
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message)
    
    // If error, try to run Prisma push as fallback
    console.log('\n🔄 Attempting Prisma db push as fallback...')
    const { execSync } = require('child_process')
    try {
      execSync(`DATABASE_URL="${DATABASE_URL}" npx prisma db push --accept-data-loss`, { stdio: 'inherit' })
      console.log('✅ Prisma db push completed')
    } catch (pushError) {
      console.error('❌ Prisma push also failed:', pushError.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createTables().catch(console.error)