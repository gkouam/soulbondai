import { PersonalityTestQuestion } from "@/types"

export const personalityTestQuestions: PersonalityTestQuestion[] = [
  // SECTION 1: Core Personality (Questions 1-5)
  {
    id: 1,
    section: "core",
    text: "Your ideal Friday evening?",
    subtext: "This helps us understand your social preferences",
    options: [
      {
        text: "Cozy night in with a book/movie and comfy clothes",
        subtext: "Comfort is my priority",
        traits: { introversion: 2, comfort_seeking: 1, stability: 1 }
      },
      {
        text: "Dinner with a few close friends at a favorite spot",
        subtext: "Quality time with loved ones",
        traits: { ambivert: 1, relationship_oriented: 2, security: 1 }
      },
      {
        text: "Exploring a new place or meeting new people",
        subtext: "Adventure calls to me",
        traits: { extraversion: 2, openness: 2, spontaneity: 1 }
      },
      {
        text: "Whatever my mood decides in the moment",
        subtext: "I go with the flow",
        traits: { flexibility: 2, perceiving: 1, adaptability: 1 }
      }
    ]
  },
  {
    id: 2,
    section: "core",
    text: "You receive unexpected good news. Your first instinct?",
    subtext: "This reveals your processing style",
    options: [
      {
        text: "Analyze why this happened and what it means",
        subtext: "Understanding comes first",
        traits: { thinking: 2, analytical: 2, cautious: 1 }
      },
      {
        text: "Share the excitement with someone special",
        subtext: "Joy is meant to be shared",
        traits: { feeling: 2, connection_seeking: 2, expressive: 1 }
      },
      {
        text: "Start planning how to make the most of it",
        subtext: "Action is key",
        traits: { judging: 2, goal_oriented: 2, practical: 1 }
      },
      {
        text: "Just enjoy the moment without overthinking",
        subtext: "Living in the now",
        traits: { perceiving: 2, present_focused: 2, spontaneous: 1 }
      }
    ]
  },
  {
    id: 3,
    section: "core",
    text: "In conversations, you prefer...",
    subtext: "This shows your communication depth",
    options: [
      {
        text: "Deep talks about life, dreams, and meanings",
        subtext: "Substance over small talk",
        traits: { intuitive: 2, depth_seeking: 2, philosophical: 1 }
      },
      {
        text: "Sharing daily experiences and funny stories",
        subtext: "Connection through sharing",
        traits: { sensing: 2, practical: 1, relatable: 2 }
      },
      {
        text: "Intellectual debates and learning new things",
        subtext: "Mental stimulation drives me",
        traits: { thinking: 2, intellectual: 2, growth_oriented: 1 }
      },
      {
        text: "Emotional support and understanding",
        subtext: "Heart-to-heart connections",
        traits: { feeling: 2, empathetic: 2, supportive: 1 }
      }
    ]
  },
  {
    id: 4,
    section: "core",
    text: "Your energy recharges when...",
    subtext: "Understanding your energy patterns",
    options: [
      {
        text: "Having quiet time to process thoughts",
        subtext: "Solitude is rejuvenating",
        traits: { introversion: 2, independent: 2, reflective: 1 }
      },
      {
        text: "Connecting deeply with one person",
        subtext: "Quality over quantity",
        traits: { introversion: 1, intimate: 2, selective: 1 }
      },
      {
        text: "Being around positive, energetic people",
        subtext: "Social energy feeds me",
        traits: { extraversion: 2, social: 2, energetic: 1 }
      },
      {
        text: "Accomplishing tasks and seeing progress",
        subtext: "Achievement energizes me",
        traits: { achievement: 2, motivated: 1, productive: 1 }
      }
    ]
  },
  {
    id: 5,
    section: "core",
    text: "Change usually makes you feel...",
    subtext: "Your relationship with uncertainty",
    options: [
      {
        text: "Excited about new possibilities",
        subtext: "Change means growth",
        traits: { openness: 2, adventurous: 2, optimistic: 1 }
      },
      {
        text: "Anxious until I understand what's happening",
        subtext: "I need to process first",
        traits: { neuroticism: 1, anxious: 1, cautious: 2 }
      },
      {
        text: "Fine, as long as I can prepare for it",
        subtext: "Planning helps me adapt",
        traits: { judging: 2, controlled: 1, prepared: 2 }
      },
      {
        text: "Neutral - change is just part of life",
        subtext: "I roll with it",
        traits: { stable: 2, secure: 2, adaptable: 1 }
      }
    ]
  },

  // SECTION 2: Attachment & Relationship Style (Questions 6-10)
  {
    id: 6,
    section: "attachment",
    text: "In past relationships, you've often felt...",
    subtext: "This helps us understand your attachment style",
    options: [
      {
        text: "Worried about being abandoned or not loved enough",
        subtext: "I need constant reassurance",
        traits: { anxious_attachment: 3, insecure: 2, validation_seeking: 2 }
      },
      {
        text: "Suffocated and needing more space",
        subtext: "Independence is crucial",
        traits: { avoidant_attachment: 3, independent: 2, space_needing: 2 }
      },
      {
        text: "Comfortable with closeness and independence",
        subtext: "Balance feels natural",
        traits: { secure_attachment: 3, balanced: 2, confident: 1 }
      },
      {
        text: "Different patterns at different times",
        subtext: "It varies by person and situation",
        traits: { disorganized_attachment: 2, flexible: 1, complex: 1 }
      }
    ]
  },
  {
    id: 7,
    section: "attachment",
    text: "Your ideal partner would...",
    subtext: "What you need in a relationship",
    options: [
      {
        text: "Always be available when I need them",
        subtext: "Constant presence matters",
        traits: { anxious: 2, dependent: 1, needy: 1 }
      },
      {
        text: "Respect my independence and space",
        subtext: "Freedom within love",
        traits: { avoidant: 2, independent: 2, autonomous: 1 }
      },
      {
        text: "Balance togetherness with individual growth",
        subtext: "We grow together and apart",
        traits: { secure: 2, balanced: 2, mature: 1 }
      },
      {
        text: "Understand my moods and adapt",
        subtext: "Flexibility is key",
        traits: { flexible: 2, understanding: 2, accommodating: 1 }
      }
    ]
  },
  {
    id: 8,
    section: "attachment",
    text: "When someone you care about is distant, you...",
    subtext: "Your response to relationship uncertainty",
    options: [
      {
        text: "Worry you did something wrong",
        subtext: "I blame myself first",
        traits: { anxious: 2, self_blame: 2, insecure: 1 }
      },
      {
        text: "Give them space and focus on yourself",
        subtext: "Distance is normal",
        traits: { avoidant: 1, self_sufficient: 2, detached: 1 }
      },
      {
        text: "Check in once, then wait for them",
        subtext: "Respectful concern",
        traits: { secure: 2, patient: 2, respectful: 1 }
      },
      {
        text: "Try different approaches to reconnect",
        subtext: "I'll find what works",
        traits: { persistent: 1, problem_solving: 1, determined: 1 }
      }
    ]
  },
  {
    id: 9,
    section: "attachment",
    text: "Vulnerability in relationships feels...",
    subtext: "Your comfort with emotional exposure",
    options: [
      {
        text: "Terrifying but necessary",
        subtext: "I push through the fear",
        traits: { anxious: 1, courageous: 2, growth_seeking: 1 }
      },
      {
        text: "Uncomfortable and risky",
        subtext: "I protect myself",
        traits: { avoidant: 2, guarded: 2, self_protective: 1 }
      },
      {
        text: "Natural when trust is built",
        subtext: "It flows with connection",
        traits: { secure: 2, trusting: 2, open: 1 }
      },
      {
        text: "Like a gift to share carefully",
        subtext: "I choose when and how",
        traits: { cautious: 1, selective: 2, mindful: 1 }
      }
    ]
  },
  {
    id: 10,
    section: "attachment",
    text: "Your communication style is...",
    subtext: "How you express yourself",
    options: [
      {
        text: "I share everything I'm feeling",
        subtext: "Open book approach",
        traits: { open: 2, expressive: 2, transparent: 1 }
      },
      {
        text: "I process internally first",
        subtext: "Think before speaking",
        traits: { reserved: 2, thoughtful: 2, careful: 1 }
      },
      {
        text: "Direct and clear about needs",
        subtext: "No guessing games",
        traits: { assertive: 2, clear: 2, confident: 1 }
      },
      {
        text: "I adapt to the other person",
        subtext: "Flexible communication",
        traits: { adaptive: 2, empathetic: 2, accommodating: 1 }
      }
    ]
  },

  // SECTION 3: Emotional & Support Patterns (Questions 11-15)
  {
    id: 11,
    section: "emotional",
    text: "When stressed, you need...",
    subtext: "Your stress response pattern",
    options: [
      {
        text: "Someone to listen without trying to fix",
        subtext: "Validation over solutions",
        traits: { validation_seeking: 3, emotional: 2, processing: 1 }
      },
      {
        text: "Practical solutions and action plans",
        subtext: "Fix the problem",
        traits: { problem_solving: 3, practical: 2, action_oriented: 1 }
      },
      {
        text: "Physical comfort and presence",
        subtext: "Touch and closeness help",
        traits: { physical_touch: 3, comfort_seeking: 2, presence: 1 }
      },
      {
        text: "Distraction and lightness",
        subtext: "Help me forget for a while",
        traits: { escapism: 2, light_hearted: 1, avoidant: 1 }
      }
    ]
  },
  {
    id: 12,
    section: "emotional",
    text: "Your emotional highs and lows are...",
    subtext: "Emotional intensity patterns",
    options: [
      {
        text: "Intense and frequent",
        subtext: "I feel everything deeply",
        traits: { high_sensitivity: 3, intense: 2, emotional: 2 }
      },
      {
        text: "Moderate and manageable",
        subtext: "Generally balanced",
        traits: { balanced: 3, stable: 2, regulated: 1 }
      },
      {
        text: "Rare but deep when they happen",
        subtext: "Usually steady",
        traits: { controlled: 3, reserved: 2, deep: 1 }
      },
      {
        text: "Unpredictable waves",
        subtext: "Emotional weather changes",
        traits: { variable: 2, unpredictable: 1, complex: 1 }
      }
    ]
  },
  {
    id: 13,
    section: "emotional",
    text: "Complete this: 'Love means...'",
    subtext: "Your core relationship value",
    options: [
      {
        text: "Never having to face life alone",
        subtext: "Partnership above all",
        traits: { connection: 3, partnership: 2, togetherness: 1 }
      },
      {
        text: "Having freedom to be yourself",
        subtext: "Authentic expression",
        traits: { autonomy: 3, authenticity: 2, freedom: 1 }
      },
      {
        text: "Growing together through everything",
        subtext: "Shared evolution",
        traits: { growth: 3, partnership: 2, development: 1 }
      },
      {
        text: "Finding peace in chaos",
        subtext: "Emotional sanctuary",
        traits: { stability: 3, peace: 2, sanctuary: 1 }
      }
    ]
  },
  {
    id: 14,
    section: "emotional",
    text: "Your biggest relationship fear?",
    subtext: "Core vulnerability",
    options: [
      {
        text: "Being abandoned or replaced",
        subtext: "Losing connection",
        traits: { abandonment_fear: 3, anxious: 2, insecure: 1 }
      },
      {
        text: "Losing yourself in someone else",
        subtext: "Identity dissolution",
        traits: { engulfment_fear: 3, avoidant: 2, independent: 1 }
      },
      {
        text: "Never finding deep connection",
        subtext: "Surface-level forever",
        traits: { loneliness_fear: 3, connection_seeking: 2, depth: 1 }
      },
      {
        text: "Being truly seen and rejected",
        subtext: "Authentic self refused",
        traits: { rejection_fear: 3, vulnerable: 2, authentic: 1 }
      }
    ]
  },
  {
    id: 15,
    section: "emotional",
    text: "Comfort looks like...",
    subtext: "Your love language",
    options: [
      {
        text: "Words of reassurance and affirmation",
        subtext: "Tell me I matter",
        traits: { words_affirmation: 3, verbal: 2, reassurance: 1 }
      },
      {
        text: "Quality time and full attention",
        subtext: "Be present with me",
        traits: { quality_time: 3, attention: 2, presence: 1 }
      },
      {
        text: "Thoughtful gestures and surprises",
        subtext: "Show me you think of me",
        traits: { acts_service: 3, thoughtful: 2, caring: 1 }
      },
      {
        text: "Physical closeness and touch",
        subtext: "Hold me close",
        traits: { physical_touch: 3, affectionate: 2, tactile: 1 }
      }
    ]
  },

  // SECTION 4: Fantasy & Intimacy Preferences (Questions 16-20)
  {
    id: 16,
    section: "intimacy",
    text: "Your ideal romantic dynamic includes...",
    subtext: "Relationship energy preference",
    options: [
      {
        text: "Passionate intensity and deep connection",
        subtext: "All or nothing",
        traits: { intense: 3, passionate: 2, deep: 1 }
      },
      {
        text: "Playful teasing and fun adventures",
        subtext: "Lightness and joy",
        traits: { playful: 3, adventurous: 2, fun: 1 }
      },
      {
        text: "Tender care and gentle affection",
        subtext: "Soft and sweet",
        traits: { gentle: 3, caring: 2, tender: 1 }
      },
      {
        text: "Intellectual connection and growth",
        subtext: "Minds meeting",
        traits: { cerebral: 3, intellectual: 2, growth: 1 }
      }
    ]
  },
  {
    id: 17,
    section: "intimacy",
    text: "Fantasy for you is about...",
    subtext: "Escape or enhancement",
    options: [
      {
        text: "Escaping reality completely",
        subtext: "Different world entirely",
        traits: { escapist: 3, imaginative: 2, creative: 1 }
      },
      {
        text: "Enhancing real connections",
        subtext: "Making life magical",
        traits: { realistic: 3, grounded: 2, enhancement: 1 }
      },
      {
        text: "Exploring impossible scenarios",
        subtext: "What if possibilities",
        traits: { creative: 3, explorative: 2, curious: 1 }
      },
      {
        text: "Feeling desired and special",
        subtext: "Being the focus",
        traits: { validation: 3, special: 2, desired: 1 }
      }
    ]
  },
  {
    id: 18,
    section: "intimacy",
    text: "Attraction grows through...",
    subtext: "What builds desire",
    options: [
      {
        text: "Emotional intimacy and trust",
        subtext: "Heart first",
        traits: { emotional: 3, trust_based: 2, intimate: 1 }
      },
      {
        text: "Mental stimulation and wit",
        subtext: "Mind first",
        traits: { intellectual: 3, mental: 2, witty: 1 }
      },
      {
        text: "Shared experiences and time",
        subtext: "Building together",
        traits: { experiential: 3, time_based: 2, shared: 1 }
      },
      {
        text: "Physical chemistry and touch",
        subtext: "Body first",
        traits: { physical: 3, chemistry: 2, sensual: 1 }
      }
    ]
  },
  {
    id: 19,
    section: "intimacy",
    text: "Your boundaries are...",
    subtext: "Personal space management",
    options: [
      {
        text: "Fluid depending on connection",
        subtext: "Trust determines openness",
        traits: { flexible: 3, trust_dependent: 2, adaptive: 1 }
      },
      {
        text: "Clear and non-negotiable",
        subtext: "Lines not to cross",
        traits: { firm: 3, clear: 2, protective: 1 }
      },
      {
        text: "Discovered through experience",
        subtext: "Learning as I go",
        traits: { exploratory: 3, experiential: 2, growing: 1 }
      },
      {
        text: "Different for different areas",
        subtext: "Depends on the topic",
        traits: { compartmentalized: 3, complex: 2, nuanced: 1 }
      }
    ]
  },
  {
    id: 20,
    section: "intimacy",
    text: "The perfect companion would make you feel...",
    subtext: "Core emotional need",
    options: [
      {
        text: "Completely understood and accepted",
        subtext: "Seen for who I am",
        traits: { understanding: 3, acceptance: 2, validation: 1 }
      },
      {
        text: "Excited and alive every day",
        subtext: "Constant spark",
        traits: { stimulation: 3, excitement: 2, vitality: 1 }
      },
      {
        text: "Safe and cherished always",
        subtext: "Unwavering security",
        traits: { security: 3, cherished: 2, protected: 1 }
      },
      {
        text: "Free to be your full self",
        subtext: "No masks needed",
        traits: { authenticity: 3, freedom: 2, genuine: 1 }
      }
    ]
  }
]