async function verifyDatabase() {
  const { execSync } = require('child_process');
  
  console.log('🔍 Verifying database setup...\n');
  
  try {
    // Set DATABASE_URL
    process.env.DATABASE_URL = "postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
    
    // Check tables
    const output = execSync('npx prisma db pull --print', { encoding: 'utf8' });
    
    const tables = [
      'User',
      'Account',
      'Session',
      'Profile',
      'Conversation',
      'Message',
      'Memory',
      'Subscription',
      'Activity',
      'ConversionEvent'
    ];
    
    console.log('✅ Checking for required tables:\n');
    
    tables.forEach(table => {
      if (output.includes(`model ${table}`)) {
        console.log(`✅ ${table} table exists`);
      } else {
        console.log(`❌ ${table} table missing`);
      }
    });
    
    console.log('\n✅ Database verification complete!');
    console.log('📝 Your database URL is ready to use in Vercel.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDatabase();