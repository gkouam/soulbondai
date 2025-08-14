// Test ElevenLabs API Integration
// Run with: node scripts/test-elevenlabs.js

const API_KEY = 'sk_8215108d14fb6b113542d8b02ce3fbec5cf86681148c8d74';

async function testElevenLabs() {
  console.log('🔍 Testing ElevenLabs API Connection...\n');
  
  try {
    // 1. Test API Key - Get Voices
    console.log('1️⃣ Fetching available voices...');
    const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': API_KEY
      }
    });
    
    if (!voicesResponse.ok) {
      throw new Error(`Voices API failed: ${voicesResponse.status}`);
    }
    
    const voicesData = await voicesResponse.json();
    console.log(`✅ Found ${voicesData.voices.length} voices available`);
    
    // Show first 5 voices
    console.log('\nAvailable voices:');
    voicesData.voices.slice(0, 5).forEach(voice => {
      console.log(`  - ${voice.name} (${voice.voice_id})`);
    });
    
    // 2. Test User/Subscription Info
    console.log('\n2️⃣ Checking subscription status...');
    const userResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': API_KEY
      }
    });
    
    if (!userResponse.ok) {
      throw new Error(`User API failed: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    console.log('✅ Subscription Info:');
    console.log(`  - Tier: ${userData.tier || 'Free'}`);
    console.log(`  - Character Count: ${userData.character_count || 0}`);
    console.log(`  - Character Limit: ${userData.character_limit || 10000}`);
    console.log(`  - Characters Used: ${((userData.character_count / userData.character_limit) * 100).toFixed(1)}%`);
    
    // 3. Test Voice Synthesis with a small sample
    console.log('\n3️⃣ Testing voice synthesis...');
    const testText = "Hello! This is a test of the ElevenLabs voice synthesis for SoulBond AI.";
    
    // Use Sarah voice for The Gentle personality
    const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Sarah
    
    const synthesisResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: testText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    });
    
    if (!synthesisResponse.ok) {
      const error = await synthesisResponse.text();
      throw new Error(`Synthesis failed: ${error}`);
    }
    
    console.log('✅ Voice synthesis successful!');
    console.log(`  - Model: eleven_multilingual_v2`);
    console.log(`  - Voice: Sarah (The Gentle)`);
    console.log(`  - Audio format: MPEG`);
    
    // 4. Show personality voice mappings
    console.log('\n4️⃣ Personality Voice Mappings:');
    const mappings = {
      'The Gentle': 'Sarah (EXAVITQu4vr4xnSDxMaL)',
      'The Strong': 'Rachel (21m00Tcm4TlvDq8ikWAM)',
      'The Creative': 'Domi (AZnzlk1XvdvUeBnXmlld)',
      'The Intellectual': 'Dorothy (ThT5KcBeYPX3keUQqHPh)',
      'The Adventurer': 'Freya (jsCqWAovK2LkecY7zXl4)'
    };
    
    Object.entries(mappings).forEach(([personality, voice]) => {
      console.log(`  ${personality}: ${voice}`);
    });
    
    console.log('\n✅ All tests passed! ElevenLabs API is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('  1. The API key is working correctly');
    console.log('  2. Voice synthesis is functional');
    console.log('  3. The app will now use ElevenLabs for voice generation');
    console.log('  4. OpenAI TTS will be used as fallback if needed');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Check if the API key is correct');
    console.log('  2. Verify the key has proper permissions (Text to Speech, Voices, User)');
    console.log('  3. Ensure your ElevenLabs account is active');
    console.log('  4. Check https://status.elevenlabs.io for service status');
  }
}

// Run the test
testElevenLabs();