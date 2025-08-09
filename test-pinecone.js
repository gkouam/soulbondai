// Test Pinecone Connection
// Run with: node test-pinecone.js

const { Pinecone } = require('@pinecone-database/pinecone');

async function testPinecone() {
  try {
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || 'YOUR_API_KEY_HERE',
      environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1-aws'
    });

    console.log('✅ Pinecone client initialized');

    // Get index
    const index = pinecone.index('soulbond-memories');
    console.log('✅ Connected to index: soulbond-memories');

    // Test with a simple upsert
    const testVector = {
      id: 'test-' + Date.now(),
      values: new Array(1536).fill(0.1), // Dummy 1536-dimension vector
      metadata: {
        type: 'test',
        content: 'Test connection',
        userId: 'test-user',
        timestamp: new Date().toISOString()
      }
    };

    await index.upsert([testVector]);
    console.log('✅ Successfully upserted test vector');

    // Query to verify
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0.1),
      topK: 1,
      includeMetadata: true
    });

    console.log('✅ Query successful:', queryResponse.matches.length, 'results found');

    // Clean up test vector
    await index.deleteOne(testVector.id);
    console.log('✅ Cleaned up test vector');

    console.log('\n🎉 Pinecone is fully configured and working!');
  } catch (error) {
    console.error('❌ Pinecone test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your API key is correct');
    console.log('2. Verify the environment matches your Pinecone project');
    console.log('3. Ensure index "soulbond-memories" exists with 1536 dimensions');
  }
}

testPinecone();