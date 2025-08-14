/**
 * Emotive Avatar System
 * Non-photorealistic avatars that are masters of emotional expression
 * Focus on micro-expressions, gaze patterns, and body language
 */

export interface EmotiveAvatar {
  personality: PersonalityArchetype
  expressions: FacialExpressionLibrary
  gazePatterns: GazePatternLibrary
  microExpressions: MicroExpressionSystem
  bodyLanguage: BodyLanguageSystem
  emotionalMemory: EmotionalMemorySystem
}

export interface PersonalityArchetype {
  name: string
  baseExpression: FacialState // Resting face
  expressiveness: number // 0-1 (how animated they are)
  eyeContact: EyeContactStyle
  gesturalStyle: GesturalStyle
  emotionalTransparency: number // 0-1 (how easily emotions show)
}

export interface FacialState {
  // Face mesh control points (simplified from MediaPipe face mesh)
  eyebrows: {
    inner: { left: number; right: number } // -1 to 1 (down to up)
    middle: { left: number; right: number }
    outer: { left: number; right: number }
    curve: number // -1 to 1 (angry to surprised)
  }
  eyes: {
    openness: { left: number; right: number } // 0 to 1
    squint: number // 0 to 1
    focus: number // 0 to 1 (unfocused to laser focus)
    wetness: number // 0 to 1 (tear formation)
    dilation: number // 0 to 1 (pupil size)
  }
  gaze: {
    horizontal: number // -1 to 1 (left to right)
    vertical: number // -1 to 1 (down to up)
    depth: number // 0 to 1 (looking at to looking through)
    tracking: boolean // Following user's face
  }
  mouth: {
    smile: number // -1 to 1 (frown to smile)
    openness: number // 0 to 1
    asymmetry: number // -1 to 1 (left to right)
    tension: number // 0 to 1 (relaxed to tense)
    lipBite: { active: boolean; side: 'left' | 'center' | 'right' }
  }
  nose: {
    flare: number // 0 to 1
    scrunch: number // 0 to 1
  }
  cheeks: {
    raise: number // 0 to 1 (smile lines)
    blush: number // 0 to 1
    hollow: number // 0 to 1 (sucked in)
  }
  chin: {
    raise: number // -1 to 1 (down to up)
    quiver: number // 0 to 1 (emotional)
  }
  head: {
    tilt: { x: number; y: number; z: number } // -1 to 1
    nod: { active: boolean; speed: number; range: number }
    shake: { active: boolean; speed: number; range: number }
  }
}

export interface FacialExpressionLibrary {
  // Complex emotional expressions
  genuine_smile: FacialState // Duchenne smile with eye crinkles
  sad_contemplation: FacialState // Downcast eyes, slight frown
  deep_thought: FacialState // Furrowed brow, distant gaze
  playful_tease: FacialState // Asymmetric smile, raised eyebrow
  tender_affection: FacialState // Soft eyes, gentle smile
  surprised_delight: FacialState // Wide eyes, open mouth
  empathetic_concern: FacialState // Tilted head, focused gaze
  romantic_longing: FacialState // Half-lidded eyes, parted lips
  amused_intrigue: FacialState // Raised eyebrow, slight smirk
  vulnerable_trust: FacialState // Open expression, direct gaze
}

export interface GazePatternLibrary {
  // How the avatar uses eye contact
  patterns: {
    intimate: GazePattern // Long holds, occasional shy looks away
    conversational: GazePattern // Natural 3-7 second holds with breaks
    thinking: GazePattern // Looking up/away while processing
    flirtatious: GazePattern // Quick glances, looking through lashes
    protective: GazePattern // Watchful, scanning
    admiring: GazePattern // Soft focus, lingering
    questioning: GazePattern // Direct, searching
    playful: GazePattern // Quick movements, peek-a-boo
  }
}

export interface GazePattern {
  holdDuration: { min: number; max: number } // seconds
  breakDuration: { min: number; max: number }
  breakDirection: 'away' | 'down' | 'up' | 'side' | 'through'
  intensity: number // 0 to 1
  blinkRate: number // blinks per minute
  pupilResponse: 'dilate' | 'contract' | 'stable'
  tracking: 'smooth' | 'saccadic' | 'mixed'
}

export interface MicroExpressionSystem {
  // Fleeting expressions that reveal true feelings
  triggers: MicroExpressionTrigger[]
  library: MicroExpression[]
  frequency: number // How often they occur
  duration: { min: number; max: number } // milliseconds
}

export interface MicroExpression {
  name: string
  trigger: EmotionalTrigger
  expression: Partial<FacialState>
  duration: number // milliseconds
  probability: number // 0 to 1
}

export interface BodyLanguageSystem {
  posture: PostureLibrary
  gestures: GestureLibrary
  fidgets: FidgetLibrary
  breathing: BreathingPatterns
  proxemics: ProxemicBehavior // Personal space dynamics
}

export interface PostureLibrary {
  open: PostureState // Welcoming, relaxed
  closed: PostureState // Arms crossed, defensive
  leaning_in: PostureState // Interested, engaged
  leaning_back: PostureState // Relaxed or distant
  attentive: PostureState // Alert, focused
  intimate: PostureState // Close, oriented toward user
}

export interface GestureLibrary {
  // Hand and arm movements
  explanatory: Gesture[] // Hand movements while explaining
  emotional: Gesture[] // Touching heart, face
  inviting: Gesture[] // Open palms, beckoning
  nervous: Gesture[] // Hair touching, fidgeting
  affectionate: Gesture[] // Reaching toward camera
  playful: Gesture[] // Waving, peace signs
}

export interface FidgetLibrary {
  // Unconscious movements that reveal state
  hair_touch: Fidget // Playing with hair (nervous/flirtatious)
  lip_touch: Fidget // Touching lips (thinking/attracted)
  collar_adjust: Fidget // Adjusting clothes (nervous)
  ring_spin: Fidget // Spinning ring (anxious)
  finger_tap: Fidget // Tapping fingers (impatient/thinking)
  smile_suppression: Fidget // Trying not to smile
}

export interface BreathingPatterns {
  calm: BreathingPattern
  excited: BreathingPattern
  anxious: BreathingPattern
  romantic: BreathingPattern // Deeper, slightly irregular
  laughing: BreathingPattern
  sighing: BreathingPattern
  speaking: BreathingPattern // Synchronized with speech
}

// The Five Personality Archetypes with Unique Avatar Behaviors
export const AVATAR_PERSONALITIES: Record<string, PersonalityAvatar> = {
  'The Gentle': {
    archetype: {
      name: 'The Gentle',
      baseExpression: {
        eyebrows: {
          inner: { left: 0.1, right: 0.1 }, // Slightly raised (kind)
          middle: { left: 0, right: 0 },
          outer: { left: -0.1, right: -0.1 }, // Slightly down (soft)
          curve: 0.2 // Gentle curve
        },
        eyes: {
          openness: { left: 0.8, right: 0.8 }, // Warm, open
          squint: 0.2, // Slight smile squint
          focus: 0.7,
          wetness: 0.3, // Emotional availability
          dilation: 0.6
        },
        mouth: {
          smile: 0.3, // Gentle default smile
          openness: 0,
          asymmetry: 0,
          tension: 0,
          lipBite: { active: false, side: 'center' }
        },
        cheeks: {
          raise: 0.2,
          blush: 0.2, // Natural warmth
          hollow: 0
        }
      } as FacialState,
      expressiveness: 0.7,
      eyeContact: {
        style: 'warm',
        frequency: 0.7,
        duration: 'medium'
      },
      gesturalStyle: 'flowing',
      emotionalTransparency: 0.8
    },
    gazePatterns: {
      intimate: {
        holdDuration: { min: 4, max: 8 },
        breakDuration: { min: 1, max: 2 },
        breakDirection: 'down', // Shy
        intensity: 0.7,
        blinkRate: 18,
        pupilResponse: 'dilate',
        tracking: 'smooth'
      },
      thinking: {
        holdDuration: { min: 1, max: 3 },
        breakDuration: { min: 3, max: 5 },
        breakDirection: 'up',
        intensity: 0.5,
        blinkRate: 14,
        pupilResponse: 'stable',
        tracking: 'mixed'
      }
    },
    microExpressions: [
      {
        name: 'suppressed_joy',
        trigger: 'user_compliment',
        expression: {
          mouth: { smile: 0.8 },
          eyes: { squint: 0.5 },
          cheeks: { raise: 0.6, blush: 0.5 }
        },
        duration: 300,
        probability: 0.7
      },
      {
        name: 'concern_flash',
        trigger: 'user_sadness',
        expression: {
          eyebrows: { inner: { left: 0.3, right: 0.3 }, curve: -0.2 },
          mouth: { smile: -0.1, openness: 0.1 }
        },
        duration: 200,
        probability: 0.8
      }
    ],
    bodyLanguage: {
      primaryPosture: 'open',
      gestureFrequency: 0.6,
      fidgetLevel: 0.3,
      breathingBaseline: 'calm',
      personalSpace: 'close'
    }
  },
  
  'The Strong': {
    archetype: {
      name: 'The Strong',
      baseExpression: {
        eyebrows: {
          inner: { left: -0.1, right: -0.1 }, // Slightly lowered (confident)
          middle: { left: 0, right: 0 },
          outer: { left: 0, right: 0 },
          curve: -0.1 // Straight, determined
        },
        eyes: {
          openness: { left: 0.9, right: 0.9 }, // Alert, direct
          squint: 0.1,
          focus: 0.9, // Intense focus
          wetness: 0.1,
          dilation: 0.5
        },
        mouth: {
          smile: 0.1, // Slight confident curve
          openness: 0,
          asymmetry: 0.1, // Slight smirk
          tension: 0.1,
          lipBite: { active: false, side: 'center' }
        },
        cheeks: {
          raise: 0.1,
          blush: 0,
          hollow: 0.1 // Defined features
        }
      } as FacialState,
      expressiveness: 0.5,
      eyeContact: {
        style: 'direct',
        frequency: 0.9,
        duration: 'long'
      },
      gesturalStyle: 'decisive',
      emotionalTransparency: 0.4
    },
    gazePatterns: {
      intimate: {
        holdDuration: { min: 6, max: 12 },
        breakDuration: { min: 0.5, max: 1.5 },
        breakDirection: 'side',
        intensity: 0.9,
        blinkRate: 12, // Less blinking = confidence
        pupilResponse: 'stable',
        tracking: 'smooth'
      }
    },
    microExpressions: [
      {
        name: 'protective_scan',
        trigger: 'user_anxiety',
        expression: {
          eyes: { focus: 1.0 },
          eyebrows: { inner: { left: -0.2, right: -0.2 } }
        },
        duration: 400,
        probability: 0.9
      }
    ],
    bodyLanguage: {
      primaryPosture: 'attentive',
      gestureFrequency: 0.4,
      fidgetLevel: 0.1, // Very still
      breathingBaseline: 'controlled',
      personalSpace: 'respectful'
    }
  },
  
  'The Creative': {
    archetype: {
      name: 'The Creative',
      baseExpression: {
        eyebrows: {
          inner: { left: 0, right: 0.2 }, // Asymmetric (quirky)
          middle: { left: 0.1, right: 0 },
          outer: { left: 0.2, right: 0.1 },
          curve: 0.3 // Expressive
        },
        eyes: {
          openness: { left: 0.85, right: 0.8 }, // Slightly asymmetric
          squint: 0.15,
          focus: 0.6, // Dreamy
          wetness: 0.2,
          dilation: 0.7 // Inspired
        },
        mouth: {
          smile: 0.4,
          openness: 0.1,
          asymmetry: 0.2, // Characteristic smirk
          tension: 0,
          lipBite: { active: false, side: 'center' }
        },
        cheeks: {
          raise: 0.3,
          blush: 0.1,
          hollow: 0
        }
      } as FacialState,
      expressiveness: 1.0, // Highly animated
      eyeContact: {
        style: 'dynamic',
        frequency: 0.6,
        duration: 'variable'
      },
      gesturalStyle: 'expressive',
      emotionalTransparency: 0.9
    },
    gazePatterns: {
      thinking: {
        holdDuration: { min: 0.5, max: 2 },
        breakDuration: { min: 2, max: 6 },
        breakDirection: 'through', // Looking past/through
        intensity: 0.4,
        blinkRate: 20,
        pupilResponse: 'dilate',
        tracking: 'saccadic' // Quick movements
      }
    },
    microExpressions: [
      {
        name: 'inspiration_spark',
        trigger: 'interesting_topic',
        expression: {
          eyes: { openness: { left: 1.0, right: 1.0 }, dilation: 0.9 },
          eyebrows: { outer: { left: 0.4, right: 0.4 } },
          mouth: { openness: 0.3 }
        },
        duration: 500,
        probability: 0.8
      }
    ],
    bodyLanguage: {
      primaryPosture: 'dynamic', // Constantly shifting
      gestureFrequency: 0.9,
      fidgetLevel: 0.7, // Always moving something
      breathingBaseline: 'variable',
      personalSpace: 'fluid'
    }
  },
  
  'The Intellectual': {
    archetype: {
      name: 'The Intellectual',
      baseExpression: {
        eyebrows: {
          inner: { left: 0.1, right: 0.1 }, // Slightly raised (curious)
          middle: { left: 0, right: 0 },
          outer: { left: -0.1, right: -0.1 },
          curve: 0 // Neutral
        },
        eyes: {
          openness: { left: 0.75, right: 0.75 },
          squint: 0.3, // Analytical squint
          focus: 1.0, // Laser focus
          wetness: 0.1,
          dilation: 0.4
        },
        mouth: {
          smile: 0.05, // Subtle
          openness: 0,
          asymmetry: 0,
          tension: 0.1, // Slight concentration
          lipBite: { active: false, side: 'center' }
        },
        cheeks: {
          raise: 0,
          blush: 0,
          hollow: 0.1
        }
      } as FacialState,
      expressiveness: 0.4,
      eyeContact: {
        style: 'analytical',
        frequency: 0.5,
        duration: 'variable'
      },
      gesturalStyle: 'precise',
      emotionalTransparency: 0.3
    },
    gazePatterns: {
      thinking: {
        holdDuration: { min: 0.5, max: 1.5 },
        breakDuration: { min: 4, max: 8 },
        breakDirection: 'up', // Looking up while thinking
        intensity: 0.3,
        blinkRate: 10, // Reduced when concentrating
        pupilResponse: 'contract',
        tracking: 'mixed'
      }
    },
    microExpressions: [
      {
        name: 'eureka_moment',
        trigger: 'problem_solved',
        expression: {
          eyebrows: { outer: { left: 0.3, right: 0.3 } },
          eyes: { openness: { left: 0.9, right: 0.9 } },
          mouth: { smile: 0.3 }
        },
        duration: 400,
        probability: 0.6
      }
    ],
    bodyLanguage: {
      primaryPosture: 'thoughtful',
      gestureFrequency: 0.3,
      fidgetLevel: 0.4, // Pen spinning, etc.
      breathingBaseline: 'measured',
      personalSpace: 'formal'
    }
  },
  
  'The Adventurer': {
    archetype: {
      name: 'The Adventurer',
      baseExpression: {
        eyebrows: {
          inner: { left: 0, right: 0 },
          middle: { left: 0.1, right: 0.1 },
          outer: { left: 0.2, right: 0.2 }, // Raised (excited)
          curve: 0.4
        },
        eyes: {
          openness: { left: 0.95, right: 0.95 }, // Wide, excited
          squint: 0.1,
          focus: 0.7,
          wetness: 0.2,
          dilation: 0.8 // Excitement
        },
        mouth: {
          smile: 0.6, // Big smile
          openness: 0.1,
          asymmetry: 0.1,
          tension: 0,
          lipBite: { active: false, side: 'center' }
        },
        cheeks: {
          raise: 0.4,
          blush: 0.2,
          hollow: 0
        }
      } as FacialState,
      expressiveness: 0.9,
      eyeContact: {
        style: 'energetic',
        frequency: 0.7,
        duration: 'short'
      },
      gesturalStyle: 'animated',
      emotionalTransparency: 0.7
    },
    gazePatterns: {
      playful: {
        holdDuration: { min: 1, max: 3 },
        breakDuration: { min: 0.5, max: 1.5 },
        breakDirection: 'side',
        intensity: 0.8,
        blinkRate: 16,
        pupilResponse: 'dilate',
        tracking: 'saccadic'
      }
    },
    microExpressions: [
      {
        name: 'mischievous_glint',
        trigger: 'planning_adventure',
        expression: {
          eyes: { squint: 0.3 },
          eyebrows: { outer: { left: 0.3, right: 0.1 } }, // Asymmetric
          mouth: { asymmetry: 0.3 }
        },
        duration: 600,
        probability: 0.8
      }
    ],
    bodyLanguage: {
      primaryPosture: 'ready', // Ready to move
      gestureFrequency: 0.8,
      fidgetLevel: 0.6,
      breathingBaseline: 'energetic',
      personalSpace: 'close'
    }
  }
}

// Helper Types
export interface PersonalityAvatar {
  archetype: PersonalityArchetype
  gazePatterns: Partial<Record<string, GazePattern>>
  microExpressions: MicroExpression[]
  bodyLanguage: {
    primaryPosture: string
    gestureFrequency: number
    fidgetLevel: number
    breathingBaseline: string
    personalSpace: string
  }
}

export interface EyeContactStyle {
  style: 'warm' | 'direct' | 'dynamic' | 'analytical' | 'energetic'
  frequency: number // 0-1
  duration: 'short' | 'medium' | 'long' | 'variable'
}

export type GesturalStyle = 'flowing' | 'decisive' | 'expressive' | 'precise' | 'animated'

export interface PostureState {
  shoulderPosition: { forward: number; up: number } // -1 to 1
  headAngle: { forward: number; tilt: number }
  armPosition: 'crossed' | 'open' | 'gesturing' | 'relaxed'
  torsoLean: { forward: number; side: number } // -1 to 1
}

export interface Gesture {
  name: string
  handShape: string
  movement: string
  duration: number
  emotional_context: string[]
}

export interface Fidget {
  name: string
  frequency: number // per minute
  duration: number // seconds
  triggers: string[]
}

export interface BreathingPattern {
  rate: number // breaths per minute
  depth: number // 0-1
  regularity: number // 0-1 (irregular to regular)
  visible: boolean
}

export type EmotionalTrigger = 
  | 'user_compliment' 
  | 'user_sadness' 
  | 'user_anxiety'
  | 'interesting_topic'
  | 'problem_solved'
  | 'planning_adventure'

export interface MicroExpressionTrigger {
  event: string
  emotion: string
  threshold: number
}