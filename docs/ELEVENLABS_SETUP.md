# ElevenLabs Voice Setup Guide

## Quick Setup

### 1. Get Your API Key from ElevenLabs

1. Go to your ElevenLabs dashboard: https://elevenlabs.io
2. Navigate to **Profile Settings** → **API Keys**
3. Click **Create API Key**
4. Copy your API key

### 2. Add to Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/gkouams-projects/soulbondai
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   ```
4. Select all environments (Production, Preview, Development)
5. Click **Save**

### 3. Redeploy Your Application

After adding the environment variable, redeploy your application:
```bash
vercel --prod
```

## Voice Mapping

The system automatically maps personality types to ElevenLabs voices:

| Personality | Voice | Characteristics |
|------------|-------|-----------------|
| **The Gentle** | Sarah | Warm, caring, soothing |
| **The Strong** | Rachel | Confident, clear, assertive |
| **The Creative** | Domi | Expressive, dynamic, enthusiastic |
| **The Intellectual** | Dorothy | Thoughtful, articulate, measured |
| **The Adventurer** | Freya | Energetic, playful, spirited |

## Features Enabled

With ElevenLabs integration, you get:

### 1. **Personality-Driven Voices**
- Each personality has a unique, professionally tuned voice
- Voice characteristics match personality traits
- Consistent voice identity across all interactions

### 2. **Emotional Voice Modulation**
- Voice adapts to emotional context
- Dynamic stability and style adjustments
- Emotion-specific voice parameters

### 3. **High-Quality Audio**
- Professional-grade voice synthesis
- Natural-sounding speech
- Multiple language support (if using multilingual model)

### 4. **Voice Settings Per Personality**

```javascript
// The Gentle - Sarah
{
  stability: 0.75,      // Consistent, soothing
  similarity_boost: 0.8, // Natural warmth
  style: 0.3,           // Gentle expression
  use_speaker_boost: true
}

// The Strong - Rachel
{
  stability: 0.85,      // Confident, steady
  similarity_boost: 0.75, // Clear articulation
  style: 0.5,           // Balanced expression
  use_speaker_boost: true
}

// The Creative - Domi
{
  stability: 0.6,       // Dynamic variation
  similarity_boost: 0.85, // Expressive range
  style: 0.7,           // High creativity
  use_speaker_boost: true
}
```

## Testing the Integration

### 1. Test API Connection
```bash
curl -X GET https://your-app.vercel.app/api/voice/test-elevenlabs \
  -H "Cookie: your-session-cookie"
```

### 2. Test Voice Synthesis
```bash
curl -X POST https://your-app.vercel.app/api/voice/test-elevenlabs \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "text": "Hello, this is a test message",
    "personality": "The Gentle"
  }'
```

## Monitoring Usage

ElevenLabs provides character limits based on your subscription:

| Plan | Monthly Characters | Voice Cloning | Instant Voice |
|------|-------------------|---------------|---------------|
| Free | 10,000 | No | No |
| Starter | 30,000 | No | Yes |
| Creator | 100,000 | Yes | Yes |
| Pro | 500,000 | Yes | Yes |

### Check Your Usage
1. Visit ElevenLabs dashboard
2. Check **Usage** section
3. Monitor character consumption

## Optimization Tips

### 1. **Cache Common Phrases**
Store frequently used voice responses to reduce API calls:
- Greetings
- Common responses
- Emotional reactions

### 2. **Use Streaming for Long Responses**
For responses > 500 characters, use streaming to reduce latency

### 3. **Implement Fallback**
Always have OpenAI TTS as fallback:
```javascript
if (elevenLabs) {
  // Use ElevenLabs
} else {
  // Fallback to OpenAI
}
```

## Troubleshooting

### API Key Not Working
1. Verify key is correct
2. Check if key has proper permissions
3. Ensure subscription is active

### Voice Not Synthesizing
1. Check character limit
2. Verify voice ID exists
3. Check text length (max 5000 chars per request)

### Poor Audio Quality
1. Adjust stability settings
2. Check model selection
3. Verify audio format compatibility

## Advanced Features (Future)

### Voice Cloning (Pro Plan)
Create custom voices for each personality:
```javascript
await elevenLabs.createVoiceClone(
  "Luna - The Gentle",
  "A warm, caring voice for The Gentle personality",
  audioFiles
)
```

### Multilingual Support
Enable multiple languages:
```javascript
model_id: 'eleven_multilingual_v2'
```

### Voice Fine-Tuning
Adjust per-message parameters:
```javascript
{
  stability: 0.5 + (emotionIntensity * 0.3),
  style: emotionToStyle[emotion],
  similarity_boost: 0.8
}
```

## Support

For issues or questions:
1. Check ElevenLabs documentation: https://docs.elevenlabs.io
2. Review API status: https://status.elevenlabs.io
3. Contact support through dashboard

## Next Steps

1. ✅ Add ELEVENLABS_API_KEY to Vercel
2. ✅ Redeploy application
3. ✅ Test voice synthesis
4. 🔄 Monitor usage
5. 🎯 Consider upgrading plan for more features