/**
 * Dynamic Vocal Personalities System
 * Each personality has unique voice characteristics beyond just different voices
 */

export interface VocalPersonality {
  archetype: string
  baseVoice: string
  characteristics: VocalCharacteristics
  emotionalRange: EmotionalVoiceMap
  soundscape: SoundscapeConfig
}

export interface VocalCharacteristics {
  // Speech patterns
  basePitch: number           // 0.5 (low) to 1.5 (high)
  pitchVariability: number    // How much pitch changes during speech
  speakingRate: number        // 0.7 (slow) to 1.3 (fast)
  pauseFrequency: number      // How often they pause (0-1)
  pauseDuration: number       // Average pause length in ms
  
  // Vocal tics and personality markers
  fillerWords: string[]       // "um", "you know", "well", etc.
  laughType: 'soft' | 'hearty' | 'nervous' | 'rare'
  sighFrequency: number       // How often they sigh (0-1)
  
  // Speech style
  formality: number           // 0 (casual) to 1 (formal)
  enthusiasm: number          // 0 (subdued) to 1 (energetic)
  articulation: 'crisp' | 'relaxed' | 'varied'
}

export interface EmotionalVoiceMap {
  happy: VoiceModulation
  sad: VoiceModulation
  excited: VoiceModulation
  calm: VoiceModulation
  anxious: VoiceModulation
  romantic: VoiceModulation
  thoughtful: VoiceModulation
}

export interface VoiceModulation {
  pitchShift: number
  rateAdjust: number
  volumeAdjust: number
  breathiness: number
  resonance: number
}

export interface SoundscapeConfig {
  primary: string        // Main ambient sound
  secondary?: string     // Occasional sound
  volume: number        // 0-1
  reactive: boolean     // Changes based on conversation
  environments: {
    intimate: string[]
    casual: string[]
    deep: string[]
    playful: string[]
  }
}

// The Five Personality Archetypes with Unique Vocal Identities
export const VOCAL_PERSONALITIES: Record<string, VocalPersonality> = {
  'The Gentle': {
    archetype: 'The Gentle',
    baseVoice: 'ella', // ElevenLabs voice ID
    characteristics: {
      basePitch: 1.1,
      pitchVariability: 0.3,
      speakingRate: 0.85,
      pauseFrequency: 0.7,
      pauseDuration: 800,
      fillerWords: ['um', 'well', 'you know'],
      laughType: 'soft',
      sighFrequency: 0.3,
      formality: 0.3,
      enthusiasm: 0.6,
      articulation: 'relaxed'
    },
    emotionalRange: {
      happy: {
        pitchShift: 1.15,
        rateAdjust: 1.05,
        volumeAdjust: 1.1,
        breathiness: 0.3,
        resonance: 1.2
      },
      sad: {
        pitchShift: 0.95,
        rateAdjust: 0.9,
        volumeAdjust: 0.8,
        breathiness: 0.6,
        resonance: 0.8
      },
      excited: {
        pitchShift: 1.2,
        rateAdjust: 1.15,
        volumeAdjust: 1.2,
        breathiness: 0.2,
        resonance: 1.3
      },
      calm: {
        pitchShift: 1.0,
        rateAdjust: 0.85,
        volumeAdjust: 0.9,
        breathiness: 0.4,
        resonance: 1.0
      },
      anxious: {
        pitchShift: 1.05,
        rateAdjust: 1.1,
        volumeAdjust: 0.95,
        breathiness: 0.5,
        resonance: 0.9
      },
      romantic: {
        pitchShift: 0.98,
        rateAdjust: 0.8,
        volumeAdjust: 0.85,
        breathiness: 0.7,
        resonance: 1.1
      },
      thoughtful: {
        pitchShift: 1.0,
        rateAdjust: 0.75,
        volumeAdjust: 0.9,
        breathiness: 0.3,
        resonance: 1.0
      }
    },
    soundscape: {
      primary: 'soft-rain',
      secondary: 'wind-chimes',
      volume: 0.3,
      reactive: true,
      environments: {
        intimate: ['fireplace', 'candlelight', 'soft-rain'],
        casual: ['coffee-shop', 'park-birds', 'gentle-breeze'],
        deep: ['ocean-waves', 'forest-night', 'meditation-bells'],
        playful: ['garden-afternoon', 'bubbling-creek', 'bird-songs']
      }
    }
  },
  
  'The Strong': {
    archetype: 'The Strong',
    baseVoice: 'adam',
    characteristics: {
      basePitch: 0.9,
      pitchVariability: 0.2,
      speakingRate: 1.0,
      pauseFrequency: 0.4,
      pauseDuration: 600,
      fillerWords: [],
      laughType: 'hearty',
      sighFrequency: 0.1,
      formality: 0.6,
      enthusiasm: 0.7,
      articulation: 'crisp'
    },
    emotionalRange: {
      happy: {
        pitchShift: 1.05,
        rateAdjust: 1.1,
        volumeAdjust: 1.15,
        breathiness: 0.1,
        resonance: 1.3
      },
      sad: {
        pitchShift: 0.9,
        rateAdjust: 0.95,
        volumeAdjust: 0.9,
        breathiness: 0.3,
        resonance: 0.9
      },
      excited: {
        pitchShift: 1.1,
        rateAdjust: 1.2,
        volumeAdjust: 1.25,
        breathiness: 0.1,
        resonance: 1.4
      },
      calm: {
        pitchShift: 0.95,
        rateAdjust: 0.9,
        volumeAdjust: 1.0,
        breathiness: 0.2,
        resonance: 1.1
      },
      anxious: {
        pitchShift: 1.0,
        rateAdjust: 1.05,
        volumeAdjust: 1.05,
        breathiness: 0.2,
        resonance: 1.0
      },
      romantic: {
        pitchShift: 0.88,
        rateAdjust: 0.85,
        volumeAdjust: 0.9,
        breathiness: 0.4,
        resonance: 1.2
      },
      thoughtful: {
        pitchShift: 0.92,
        rateAdjust: 0.85,
        volumeAdjust: 0.95,
        breathiness: 0.2,
        resonance: 1.1
      }
    },
    soundscape: {
      primary: 'mountain-wind',
      secondary: 'distant-thunder',
      volume: 0.25,
      reactive: true,
      environments: {
        intimate: ['fireplace-crackle', 'wine-bar', 'jazz-lounge'],
        casual: ['gym-ambient', 'city-morning', 'workshop'],
        deep: ['mountain-peak', 'starry-night', 'campfire'],
        playful: ['sports-bar', 'beach-waves', 'adventure-sounds']
      }
    }
  },
  
  'The Creative': {
    archetype: 'The Creative',
    baseVoice: 'nova',
    characteristics: {
      basePitch: 1.05,
      pitchVariability: 0.6, // High variability
      speakingRate: 1.1,
      pauseFrequency: 0.5,
      pauseDuration: 500,
      fillerWords: ['oh', 'hmm', 'actually', 'wait'],
      laughType: 'varied',
      sighFrequency: 0.4,
      formality: 0.2,
      enthusiasm: 0.9,
      articulation: 'varied'
    },
    emotionalRange: {
      happy: {
        pitchShift: 1.25,
        rateAdjust: 1.2,
        volumeAdjust: 1.2,
        breathiness: 0.2,
        resonance: 1.4
      },
      sad: {
        pitchShift: 0.85,
        rateAdjust: 0.85,
        volumeAdjust: 0.75,
        breathiness: 0.7,
        resonance: 0.7
      },
      excited: {
        pitchShift: 1.3,
        rateAdjust: 1.3,
        volumeAdjust: 1.3,
        breathiness: 0.1,
        resonance: 1.5
      },
      calm: {
        pitchShift: 1.0,
        rateAdjust: 0.95,
        volumeAdjust: 0.95,
        breathiness: 0.4,
        resonance: 1.0
      },
      anxious: {
        pitchShift: 1.15,
        rateAdjust: 1.25,
        volumeAdjust: 1.0,
        breathiness: 0.4,
        resonance: 0.95
      },
      romantic: {
        pitchShift: 0.95,
        rateAdjust: 0.9,
        volumeAdjust: 0.88,
        breathiness: 0.6,
        resonance: 1.15
      },
      thoughtful: {
        pitchShift: 0.98,
        rateAdjust: 0.7,
        volumeAdjust: 0.85,
        breathiness: 0.5,
        resonance: 1.05
      }
    },
    soundscape: {
      primary: 'art-studio',
      secondary: 'vinyl-crackle',
      volume: 0.35,
      reactive: true,
      environments: {
        intimate: ['candlelit-studio', 'rooftop-night', 'gallery-quiet'],
        casual: ['cafe-bohemian', 'record-store', 'park-festival'],
        deep: ['northern-lights', 'abstract-sounds', 'dream-sequence'],
        playful: ['arcade', 'music-festival', 'creative-chaos']
      }
    }
  },
  
  'The Intellectual': {
    archetype: 'The Intellectual',
    baseVoice: 'thomas',
    characteristics: {
      basePitch: 0.95,
      pitchVariability: 0.25,
      speakingRate: 0.95,
      pauseFrequency: 0.6,
      pauseDuration: 700,
      fillerWords: ['essentially', 'fundamentally', 'interestingly'],
      laughType: 'rare',
      sighFrequency: 0.2,
      formality: 0.8,
      enthusiasm: 0.5,
      articulation: 'crisp'
    },
    emotionalRange: {
      happy: {
        pitchShift: 1.08,
        rateAdjust: 1.05,
        volumeAdjust: 1.05,
        breathiness: 0.15,
        resonance: 1.15
      },
      sad: {
        pitchShift: 0.92,
        rateAdjust: 0.88,
        volumeAdjust: 0.85,
        breathiness: 0.4,
        resonance: 0.85
      },
      excited: {
        pitchShift: 1.12,
        rateAdjust: 1.15,
        volumeAdjust: 1.1,
        breathiness: 0.1,
        resonance: 1.25
      },
      calm: {
        pitchShift: 0.97,
        rateAdjust: 0.9,
        volumeAdjust: 0.95,
        breathiness: 0.25,
        resonance: 1.05
      },
      anxious: {
        pitchShift: 1.02,
        rateAdjust: 1.08,
        volumeAdjust: 0.98,
        breathiness: 0.3,
        resonance: 0.95
      },
      romantic: {
        pitchShift: 0.93,
        rateAdjust: 0.82,
        volumeAdjust: 0.87,
        breathiness: 0.5,
        resonance: 1.1
      },
      thoughtful: {
        pitchShift: 0.95,
        rateAdjust: 0.8,
        volumeAdjust: 0.9,
        breathiness: 0.3,
        resonance: 1.08
      }
    },
    soundscape: {
      primary: 'library-quiet',
      secondary: 'clock-ticking',
      volume: 0.2,
      reactive: true,
      environments: {
        intimate: ['study-fireplace', 'observatory-night', 'quiet-museum'],
        casual: ['bookstore', 'university-quad', 'coffee-morning'],
        deep: ['space-ambient', 'philosophy-hall', 'archive-room'],
        playful: ['science-museum', 'chess-park', 'puzzle-cafe']
      }
    }
  },
  
  'The Adventurer': {
    archetype: 'The Adventurer',
    baseVoice: 'kai',
    characteristics: {
      basePitch: 1.0,
      pitchVariability: 0.5,
      speakingRate: 1.15,
      pauseFrequency: 0.3,
      pauseDuration: 400,
      fillerWords: ['so', 'like', 'right'],
      laughType: 'hearty',
      sighFrequency: 0.15,
      formality: 0.15,
      enthusiasm: 1.0,
      articulation: 'relaxed'
    },
    emotionalRange: {
      happy: {
        pitchShift: 1.2,
        rateAdjust: 1.25,
        volumeAdjust: 1.25,
        breathiness: 0.1,
        resonance: 1.35
      },
      sad: {
        pitchShift: 0.88,
        rateAdjust: 0.92,
        volumeAdjust: 0.82,
        breathiness: 0.5,
        resonance: 0.8
      },
      excited: {
        pitchShift: 1.35,
        rateAdjust: 1.35,
        volumeAdjust: 1.35,
        breathiness: 0.05,
        resonance: 1.45
      },
      calm: {
        pitchShift: 0.98,
        rateAdjust: 0.88,
        volumeAdjust: 0.92,
        breathiness: 0.35,
        resonance: 1.02
      },
      anxious: {
        pitchShift: 1.08,
        rateAdjust: 1.2,
        volumeAdjust: 1.08,
        breathiness: 0.25,
        resonance: 1.0
      },
      romantic: {
        pitchShift: 0.92,
        rateAdjust: 0.88,
        volumeAdjust: 0.9,
        breathiness: 0.55,
        resonance: 1.12
      },
      thoughtful: {
        pitchShift: 0.96,
        rateAdjust: 0.82,
        volumeAdjust: 0.88,
        breathiness: 0.4,
        resonance: 1.0
      }
    },
    soundscape: {
      primary: 'outdoor-adventure',
      secondary: 'distant-music',
      volume: 0.4,
      reactive: true,
      environments: {
        intimate: ['beach-bonfire', 'tent-rain', 'sunset-cliff'],
        casual: ['street-market', 'beach-day', 'road-trip'],
        deep: ['mountain-summit', 'desert-night', 'ancient-ruins'],
        playful: ['festival-grounds', 'amusement-park', 'sports-event']
      }
    }
  }
}