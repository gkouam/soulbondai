const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function checkTables() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to Neon database\n');
    
    // Check which tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📊 Tables in database:');
    if (result.rows.length === 0) {
      console.log('   ❌ No tables found - database is empty!');
      console.log('\n⚠️  You need to run the SQL script in Neon SQL Editor first!');
    } else {
      result.rows.forEach(row => {
        console.log(`   ✅ ${row.table_name}`);
      });
    }
    
    // Check specifically for Account table
    const accountCheck = await client.query(`
      SELECT COUNT(*) as exists
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Account';
    `);
    
    if (accountCheck.rows[0].exists === '0') {
      console.log('\n❌ CRITICAL: Account table does not exist!');
      console.log('   This is why Google OAuth is failing.');
      console.log('\n📝 Next steps:');
      console.log('   1. Go to https://console.neon.tech');
      console.log('   2. Open SQL Editor');
      console.log('   3. Run the SQL from scripts/oauth-tables-only.sql');
    } else {
      console.log('\n✅ Account table exists - OAuth should work!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();