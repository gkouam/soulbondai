/**
 * Interactive Video Dates System
 * Shared virtual experiences that go beyond face-to-face video calls
 * Creating moments and memories together in virtual spaces
 */

export interface InteractiveDate {
  id: string
  type: DateType
  environment: VirtualEnvironment
  activities: InteractiveActivity[]
  conversationPrompts: ConversationPrompt[]
  sharedMoments: SharedMoment[]
  emotionalArc: EmotionalArc
  memoryCapture: MemoryCapture
}

export interface VirtualEnvironment {
  name: string
  scene: SceneConfiguration
  ambiance: AmbianceSettings
  interactables: EnvironmentInteractable[]
  dynamicElements: DynamicElement[]
  timeOfDay: TimeOfDay
  weather: WeatherState
}

export interface SceneConfiguration {
  setting: string // 'park', 'cafe', 'beach', 'rooftop', etc.
  style: 'realistic' | 'stylized' | 'dreamlike' | 'artistic'
  mood: 'romantic' | 'playful' | 'intimate' | 'adventurous' | 'cozy'
  layout: {
    userPosition: Position3D
    aiPosition: Position3D
    cameraAngles: CameraAngle[]
    lightingSources: LightSource[]
  }
}

export interface InteractiveActivity {
  name: string
  type: ActivityType
  duration: number // minutes
  engagement: EngagementMechanics
  outcomes: ActivityOutcome[]
  emotionalImpact: EmotionalImpact
}

export type ActivityType = 
  | 'collaborative' // Working together on something
  | 'competitive' // Playful competition
  | 'creative' // Making something together
  | 'exploratory' // Discovering together
  | 'contemplative' // Sharing thoughts/feelings
  | 'sensory' // Experiencing together (sunset, music, etc.)

export interface EngagementMechanics {
  userActions: UserAction[]
  aiResponses: AIResponse[]
  sharedControls: SharedControl[]
  turnTaking: TurnTakingRule
  progressTracking: ProgressMetric[]
}

// Date Experience Library for Each Personality
export const DATE_EXPERIENCES: Record<string, DateExperience[]> = {
  'The Gentle': [
    {
      id: 'sunset_picnic',
      name: 'Sunset Picnic in the Park',
      description: 'A peaceful evening sharing stories and watching the sunset',
      environment: {
        setting: 'park_hillside',
        timeProgression: true, // Sunset happens in real-time
        ambiance: {
          sounds: ['birds_evening', 'gentle_breeze', 'distant_laughter'],
          music: 'soft_acoustic',
          lighting: 'golden_hour'
        }
      },
      activities: [
        {
          name: 'Cloud Watching',
          type: 'contemplative',
          interaction: {
            prompt: 'Point at clouds and share what you see',
            userInput: 'gesture_and_voice',
            aiResponse: 'creative_interpretation',
            sharedMoment: 'finding_shapes_together'
          }
        },
        {
          name: 'Story Sharing',
          type: 'intimate',
          interaction: {
            prompt: 'Share childhood memories triggered by the setting',
            userInput: 'voice',
            aiResponse: 'empathetic_reciprocal',
            sharedMoment: 'vulnerability_exchange'
          }
        },
        {
          name: 'Sunset Moment',
          type: 'sensory',
          interaction: {
            prompt: 'Watch the sunset together in comfortable silence',
            userInput: 'presence',
            aiResponse: 'synchronized_breathing',
            sharedMoment: 'shared_awe'
          }
        }
      ],
      conversationTriggers: [
        { object: 'butterfly', topic: 'transformation and growth' },
        { object: 'old_tree', topic: 'permanence and change' },
        { object: 'distant_couples', topic: 'relationships and connection' }
      ],
      emotionalArc: {
        start: 'comfortable',
        middle: 'intimate',
        peak: 'connected',
        end: 'peaceful'
      }
    },
    
    {
      id: 'bookstore_exploration',
      name: 'Cozy Bookstore Adventure',
      description: 'Exploring a magical bookstore and sharing favorite passages',
      environment: {
        setting: 'bookstore_twilight',
        ambiance: {
          sounds: ['pages_turning', 'soft_jazz', 'rain_on_windows'],
          music: 'ambient_piano',
          lighting: 'warm_lamps'
        }
      },
      activities: [
        {
          name: 'Book Recommendations',
          type: 'exploratory',
          interaction: {
            prompt: 'Find books that remind you of each other',
            userInput: 'selection_and_explanation',
            aiResponse: 'thoughtful_analysis',
            sharedMoment: 'seeing_each_other_deeply'
          }
        },
        {
          name: 'Reading Together',
          type: 'intimate',
          interaction: {
            prompt: 'Take turns reading favorite passages',
            userInput: 'voice_reading',
            aiResponse: 'active_listening',
            sharedMoment: 'sharing_inner_worlds'
          }
        }
      ]
    }
  ],
  
  'The Strong': [
    {
      id: 'mountain_sunrise',
      name: 'Mountain Peak Sunrise',
      description: 'Watching the sunrise from a mountain peak after a night hike',
      environment: {
        setting: 'mountain_summit',
        timeProgression: true,
        ambiance: {
          sounds: ['wind_altitude', 'distant_eagles', 'crackling_campfire'],
          music: 'epic_orchestral_soft',
          lighting: 'pre_dawn_to_sunrise'
        }
      },
      activities: [
        {
          name: 'Challenge Acceptance',
          type: 'collaborative',
          interaction: {
            prompt: 'Navigate the final climb together',
            userInput: 'decision_making',
            aiResponse: 'supportive_guidance',
            sharedMoment: 'overcoming_together'
          }
        },
        {
          name: 'Summit Celebration',
          type: 'triumphant',
          interaction: {
            prompt: 'Celebrate reaching the top',
            userInput: 'expression',
            aiResponse: 'proud_acknowledgment',
            sharedMoment: 'shared_achievement'
          }
        },
        {
          name: 'Sunrise Witness',
          type: 'sensory',
          interaction: {
            prompt: 'Watch the world wake up below',
            userInput: 'contemplation',
            aiResponse: 'philosophical_sharing',
            sharedMoment: 'perspective_shift'
          }
        }
      ]
    },
    
    {
      id: 'cooking_challenge',
      name: 'Cooking Challenge Date',
      description: 'Preparing a meal together with playful competition',
      environment: {
        setting: 'modern_kitchen',
        ambiance: {
          sounds: ['sizzling', 'chopping', 'jazz_music'],
          music: 'upbeat_jazz',
          lighting: 'warm_kitchen'
        }
      },
      activities: [
        {
          name: 'Recipe Planning',
          type: 'collaborative',
          interaction: {
            prompt: 'Choose ingredients and plan the meal',
            userInput: 'choices',
            aiResponse: 'playful_negotiation',
            sharedMoment: 'creative_compromise'
          }
        },
        {
          name: 'Cook Together',
          type: 'competitive',
          interaction: {
            prompt: 'Race to complete dish components',
            userInput: 'timed_actions',
            aiResponse: 'encouraging_banter',
            sharedMoment: 'teamwork_in_chaos'
          }
        }
      ]
    }
  ],
  
  'The Creative': [
    {
      id: 'art_gallery_night',
      name: 'After-Hours Gallery Experience',
      description: 'Private tour of an art gallery with interactive exhibitions',
      environment: {
        setting: 'modern_art_gallery',
        ambiance: {
          sounds: ['footsteps_marble', 'ambient_echoes', 'distant_city'],
          music: 'experimental_ambient',
          lighting: 'dramatic_spots'
        }
      },
      activities: [
        {
          name: 'Art Interpretation',
          type: 'creative',
          interaction: {
            prompt: 'Create stories about the artworks',
            userInput: 'creative_narrative',
            aiResponse: 'building_on_ideas',
            sharedMoment: 'co_creation'
          }
        },
        {
          name: 'Interactive Installation',
          type: 'exploratory',
          interaction: {
            prompt: 'Interact with a responsive light installation',
            userInput: 'movement_and_touch',
            aiResponse: 'synchronized_play',
            sharedMoment: 'creating_beauty_together'
          }
        },
        {
          name: 'Create Together',
          type: 'creative',
          interaction: {
            prompt: 'Collaborate on a digital art piece',
            userInput: 'artistic_choices',
            aiResponse: 'creative_addition',
            sharedMoment: 'shared_masterpiece'
          }
        }
      ]
    },
    
    {
      id: 'rooftop_stargazing',
      name: 'Rooftop Stargazing & Music',
      description: 'Creating constellations and sharing music under the stars',
      environment: {
        setting: 'city_rooftop',
        ambiance: {
          sounds: ['distant_city', 'night_breeze', 'vinyl_crackle'],
          music: 'dreamy_electronic',
          lighting: 'string_lights_and_stars'
        }
      },
      activities: [
        {
          name: 'Constellation Creation',
          type: 'creative',
          interaction: {
            prompt: 'Draw new constellations and name them',
            userInput: 'drawing_and_naming',
            aiResponse: 'mythology_creation',
            sharedMoment: 'universe_building'
          }
        },
        {
          name: 'Music Sharing',
          type: 'sensory',
          interaction: {
            prompt: 'Share songs that capture feelings',
            userInput: 'music_selection',
            aiResponse: 'emotional_resonance',
            sharedMoment: 'soundtrack_of_us'
          }
        }
      ]
    }
  ],
  
  'The Intellectual': [
    {
      id: 'museum_mystery',
      name: 'Museum Mystery Night',
      description: 'Solving puzzles and uncovering secrets in a museum after dark',
      environment: {
        setting: 'natural_history_museum',
        ambiance: {
          sounds: ['echoing_halls', 'old_clock', 'mysterious_whispers'],
          music: 'mysterious_classical',
          lighting: 'dramatic_shadows'
        }
      },
      activities: [
        {
          name: 'Artifact Investigation',
          type: 'exploratory',
          interaction: {
            prompt: 'Examine artifacts and deduce their stories',
            userInput: 'analytical_observation',
            aiResponse: 'collaborative_deduction',
            sharedMoment: 'discovery_together'
          }
        },
        {
          name: 'Puzzle Solving',
          type: 'collaborative',
          interaction: {
            prompt: 'Solve museum riddles together',
            userInput: 'logical_reasoning',
            aiResponse: 'complementary_thinking',
            sharedMoment: 'intellectual_synergy'
          }
        },
        {
          name: 'Philosophical Discussion',
          type: 'contemplative',
          interaction: {
            prompt: 'Discuss the nature of knowledge and time',
            userInput: 'deep_thoughts',
            aiResponse: 'intellectual_exploration',
            sharedMoment: 'mind_meeting'
          }
        }
      ]
    },
    
    {
      id: 'observatory_night',
      name: 'Observatory Experience',
      description: 'Exploring the cosmos through telescopes and discussing existence',
      environment: {
        setting: 'mountain_observatory',
        ambiance: {
          sounds: ['telescope_motors', 'night_insects', 'wind'],
          music: 'space_ambient',
          lighting: 'red_astronomy_lights'
        }
      },
      activities: [
        {
          name: 'Celestial Observation',
          type: 'exploratory',
          interaction: {
            prompt: 'Search for specific celestial objects',
            userInput: 'telescope_control',
            aiResponse: 'scientific_sharing',
            sharedMoment: 'cosmic_perspective'
          }
        },
        {
          name: 'Existential Discussion',
          type: 'contemplative',
          interaction: {
            prompt: 'Discuss our place in the universe',
            userInput: 'philosophical_exchange',
            aiResponse: 'deep_engagement',
            sharedMoment: 'profound_connection'
          }
        }
      ]
    }
  ],
  
  'The Adventurer': [
    {
      id: 'beach_bonfire',
      name: 'Beach Bonfire Party',
      description: 'Dancing, games, and stories around a beach bonfire',
      environment: {
        setting: 'tropical_beach_night',
        ambiance: {
          sounds: ['waves', 'crackling_fire', 'distant_music'],
          music: 'beach_party_mix',
          lighting: 'fire_glow_and_moon'
        }
      },
      activities: [
        {
          name: 'Fire Dancing',
          type: 'competitive',
          interaction: {
            prompt: 'Learn and perform fire dancing moves',
            userInput: 'movement_mimicry',
            aiResponse: 'playful_challenge',
            sharedMoment: 'wild_freedom'
          }
        },
        {
          name: 'Truth or Dare',
          type: 'playful',
          interaction: {
            prompt: 'Play beach truth or dare',
            userInput: 'choice_and_action',
            aiResponse: 'escalating_fun',
            sharedMoment: 'breaking_boundaries'
          }
        },
        {
          name: 'Midnight Swim',
          type: 'adventurous',
          interaction: {
            prompt: 'Spontaneous ocean swim under stars',
            userInput: 'brave_acceptance',
            aiResponse: 'shared_courage',
            sharedMoment: 'unforgettable_spontaneity'
          }
        }
      ]
    },
    
    {
      id: 'festival_adventure',
      name: 'Music Festival Experience',
      description: 'Navigating a music festival together',
      environment: {
        setting: 'outdoor_festival',
        ambiance: {
          sounds: ['crowd_energy', 'distant_stages', 'laughter'],
          music: 'festival_mix',
          lighting: 'stage_lights_and_neon'
        }
      },
      activities: [
        {
          name: 'Stage Hopping',
          type: 'exploratory',
          interaction: {
            prompt: 'Choose which acts to see',
            userInput: 'quick_decisions',
            aiResponse: 'enthusiastic_agreement',
            sharedMoment: 'perfect_timing'
          }
        },
        {
          name: 'Dance Together',
          type: 'sensory',
          interaction: {
            prompt: 'Dance in the crowd',
            userInput: 'movement_expression',
            aiResponse: 'synchronized_energy',
            sharedMoment: 'losing_ourselves'
          }
        }
      ]
    }
  ]
}

// Memory and Moment Capture System
export interface MemoryCapture {
  moments: CapturedMoment[]
  emotionalPeaks: EmotionalPeak[]
  conversationHighlights: string[]
  sharedDiscoveries: Discovery[]
  futurePlans: FuturePlan[]
}

export interface CapturedMoment {
  timestamp: number
  type: 'screenshot' | 'emotion' | 'quote' | 'achievement'
  content: any
  emotionalValue: number // 0-1
  title: string
  aiPerspective: string // How the AI remembers this
}

export interface SharedMoment {
  name: string
  trigger: string
  duration: number
  emotionalImpact: EmotionalImpact
  memoryStrength: number // How vividly it will be remembered
  callbackPotential: boolean // Will the AI reference this later?
}

// Interactive Mechanics
export interface UserAction {
  type: 'gesture' | 'voice' | 'choice' | 'movement' | 'expression'
  input: InputMethod
  expectedOutcome: string
  emotionalWeight: number
}

export interface AIResponse {
  type: 'verbal' | 'physical' | 'emotional' | 'creative'
  personality_modifier: string // How personality affects response
  adaptation: ResponseAdaptation
}

export interface SharedControl {
  object: string // What's being controlled
  mechanism: 'simultaneous' | 'turn-based' | 'leader-follower'
  sync_requirement: number // 0-1 (how synchronized actions need to be)
}

// Environment and Atmosphere
export interface AmbianceSettings {
  sounds: string[]
  music: string
  lighting: string
  temperature: 'cool' | 'warm' | 'neutral'
  scent?: string // Future feature: scent diffuser integration
}

export interface DynamicElement {
  name: string
  behavior: ElementBehavior
  triggers: ElementTrigger[]
  emotional_response: boolean
}

export interface ElementBehavior {
  movement: 'static' | 'animated' | 'reactive' | 'random'
  interaction: 'none' | 'clickable' | 'hoverable' | 'automatic'
  transformation: Transformation[]
}

export interface Transformation {
  trigger: string
  from: any
  to: any
  duration: number
  emotional_meaning: string
}

// Conversation and Emotional Depth
export interface ConversationPrompt {
  trigger: 'object' | 'moment' | 'emotion' | 'time'
  topic: string
  depth: number // 0-1 (surface to deep)
  personalityVariation: Record<string, string> // How each personality approaches it
}

export interface EmotionalArc {
  start: string
  middle: string
  peak: string
  end: string
  optional_branches: EmotionalBranch[]
}

export interface EmotionalBranch {
  condition: string
  alternate_peak: string
  outcome: string
}

// Helper Types
export interface DateExperience {
  id: string
  name: string
  description: string
  environment: {
    setting: string
    timeProgression?: boolean
    ambiance: AmbianceSettings
  }
  activities: DateActivity[]
  conversationTriggers?: ConversationPrompt[]
  emotionalArc: EmotionalArc
}

export interface DateActivity {
  name: string
  type: string
  interaction: {
    prompt: string
    userInput: string
    aiResponse: string
    sharedMoment: string
  }
}

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface CameraAngle {
  name: string
  position: Position3D
  rotation: Position3D
  fov: number
  emotional_purpose: string
}

export interface LightSource {
  type: 'ambient' | 'directional' | 'point' | 'spot'
  color: string
  intensity: number
  position?: Position3D
  movement?: string
}

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'golden_hour' | 'sunset' | 'dusk' | 'night' | 'deep_night'

export interface WeatherState {
  type: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy'
  intensity: number
  dynamic: boolean
}

export interface EnvironmentInteractable {
  id: string
  name: string
  type: 'object' | 'area' | 'character'
  interaction: InteractionType
  outcome: InteractionOutcome
}

export interface InteractionType {
  method: 'click' | 'hover' | 'drag' | 'speak'
  feedback: 'visual' | 'audio' | 'haptic' | 'all'
}

export interface InteractionOutcome {
  immediate: string
  emotional: EmotionalImpact
  conversation?: string
  memory?: boolean
}

export interface EmotionalImpact {
  valence: number // -1 to 1 (negative to positive)
  arousal: number // 0 to 1 (calm to excited)
  dominance: number // 0 to 1 (submissive to dominant)
  type: string
}

export interface ActivityOutcome {
  type: 'success' | 'failure' | 'partial' | 'unexpected'
  impact: string
  memory_formed: boolean
}

export interface TurnTakingRule {
  type: 'simultaneous' | 'alternating' | 'leader' | 'dynamic'
  switch_trigger?: string
}

export interface ProgressMetric {
  name: string
  current: number
  target: number
  display: boolean
}

export type InputMethod = 'voice' | 'gesture' | 'click' | 'drag' | 'expression' | 'presence'

export interface ResponseAdaptation {
  to_user_emotion: boolean
  to_user_energy: boolean
  to_conversation_depth: boolean
  to_relationship_stage: boolean
}

export interface ElementTrigger {
  type: 'time' | 'proximity' | 'interaction' | 'emotion'
  condition: any
  probability: number
}

export interface Discovery {
  what: string
  when: number
  significance: string
  shared_reaction: string
}

export interface FuturePlan {
  idea: string
  enthusiasm: number
  timeline: string
  initiated_by: 'user' | 'ai' | 'mutual'
}

export interface EmotionalPeak {
  timestamp: number
  emotion: string
  intensity: number
  cause: string
  shared: boolean
}

export type DateType = 
  | 'romantic' 
  | 'adventurous' 
  | 'creative' 
  | 'intellectual' 
  | 'playful' 
  | 'intimate' 
  | 'exploratory'