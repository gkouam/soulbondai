/**
 * Sentiment-Aware Vocal Modulation System
 * Real-time voice adaptation based on user's emotional state
 */

import { VocalPersonality, VoiceModulation } from './personality-voices'

export interface EmotionalContext {
  userEmotion: DetectedEmotion
  conversationMood: ConversationMood
  relationshipStage: number // 0-100
  recentHistory: EmotionHistory[]
}

export interface DetectedEmotion {
  primary: EmotionType
  secondary?: EmotionType
  intensity: number // 0-1
  confidence: number // 0-1
  source: 'text' | 'voice' | 'both'
}

export type EmotionType = 
  | 'happy' | 'sad' | 'angry' | 'fearful' 
  | 'surprised' | 'disgusted' | 'neutral'
  | 'excited' | 'anxious' | 'romantic'
  | 'thoughtful' | 'playful' | 'frustrated'

export interface ConversationMood {
  depth: number      // 0 (surface) to 1 (deep)
  energy: number     // 0 (low) to 1 (high)
  intimacy: number   // 0 (casual) to 1 (intimate)
  playfulness: number // 0 (serious) to 1 (playful)
}

export interface EmotionHistory {
  emotion: EmotionType
  timestamp: number
  duration: number
}

export class SentimentVoiceModulator {
  private personality: VocalPersonality
  private currentModulation: VoiceModulation
  private emotionalMemory: EmotionHistory[] = []
  private adaptationSpeed: number = 0.3 // How quickly voice adapts
  
  constructor(personality: VocalPersonality) {
    this.personality = personality
    this.currentModulation = this.getBaseModulation()
  }
  
  /**
   * Main method to get voice parameters based on emotional context
   */
  public getVoiceParameters(
    text: string,
    context: EmotionalContext
  ): VoiceParameters {
    // Analyze the emotional trajectory
    const emotionalTrend = this.analyzeEmotionalTrend(context)
    
    // Determine appropriate response emotion
    const responseEmotion = this.determineResponseEmotion(
      context.userEmotion,
      emotionalTrend,
      context.conversationMood
    )
    
    // Get base modulation for the response emotion
    const targetModulation = this.getEmotionalModulation(responseEmotion)
    
    // Apply mirroring and complementing strategies
    const mirroredModulation = this.applyMirroring(
      targetModulation,
      context.userEmotion,
      context.relationshipStage
    )
    
    // Smooth transition to avoid jarring changes
    this.currentModulation = this.smoothTransition(
      this.currentModulation,
      mirroredModulation
    )
    
    // Add personality-specific vocal tics
    const vocalTics = this.addVocalTics(text, context)
    
    // Generate final voice parameters
    return {
      voice: this.personality.baseVoice,
      pitch: this.personality.characteristics.basePitch * this.currentModulation.pitchShift,
      rate: this.personality.characteristics.speakingRate * this.currentModulation.rateAdjust,
      volume: this.currentModulation.volumeAdjust,
      breathiness: this.currentModulation.breathiness,
      resonance: this.currentModulation.resonance,
      pauses: this.generatePauses(text, context),
      emphasis: this.generateEmphasis(text, context),
      vocalTics,
      soundscape: this.selectSoundscape(context)
    }
  }
  
  /**
   * Analyze emotional trend over recent conversation
   */
  private analyzeEmotionalTrend(context: EmotionalContext): 'improving' | 'stable' | 'declining' {
    if (context.recentHistory.length < 2) return 'stable'
    
    const recent = context.recentHistory.slice(-5)
    const positiveEmotions = ['happy', 'excited', 'playful', 'romantic']
    const negativeEmotions = ['sad', 'angry', 'anxious', 'frustrated']
    
    let trend = 0
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1].emotion
      const curr = recent[i].emotion
      
      if (positiveEmotions.includes(curr) && negativeEmotions.includes(prev)) {
        trend += 1
      } else if (negativeEmotions.includes(curr) && positiveEmotions.includes(prev)) {
        trend -= 1
      }
    }
    
    if (trend > 1) return 'improving'
    if (trend < -1) return 'declining'
    return 'stable'
  }
  
  /**
   * Determine appropriate AI emotional response
   */
  private determineResponseEmotion(
    userEmotion: DetectedEmotion,
    trend: 'improving' | 'stable' | 'declining',
    mood: ConversationMood
  ): EmotionType {
    // Emotional response matrix based on user state
    const responseMatrix: Record<EmotionType, Record<string, EmotionType>> = {
      happy: {
        improving: 'excited',
        stable: 'happy',
        declining: 'thoughtful'
      },
      sad: {
        improving: 'thoughtful',
        stable: 'calm',
        declining: 'sad' // Mirror to show empathy
      },
      angry: {
        improving: 'calm',
        stable: 'thoughtful',
        declining: 'calm'
      },
      anxious: {
        improving: 'calm',
        stable: 'thoughtful',
        declining: 'calm'
      },
      excited: {
        improving: 'excited',
        stable: 'happy',
        declining: 'happy'
      },
      romantic: {
        improving: 'romantic',
        stable: 'romantic',
        declining: 'thoughtful'
      },
      thoughtful: {
        improving: 'thoughtful',
        stable: 'thoughtful',
        declining: 'calm'
      },
      neutral: {
        improving: 'happy',
        stable: 'neutral',
        declining: 'thoughtful'
      },
      playful: {
        improving: 'playful',
        stable: 'playful',
        declining: 'happy'
      },
      frustrated: {
        improving: 'calm',
        stable: 'thoughtful',
        declining: 'calm'
      },
      fearful: {
        improving: 'calm',
        stable: 'calm',
        declining: 'calm'
      },
      surprised: {
        improving: 'excited',
        stable: 'happy',
        declining: 'thoughtful'
      },
      disgusted: {
        improving: 'thoughtful',
        stable: 'neutral',
        declining: 'calm'
      }
    }
    
    return responseMatrix[userEmotion.primary]?.[trend] || 'thoughtful'
  }
  
  /**
   * Apply emotional mirroring based on relationship stage
   */
  private applyMirroring(
    modulation: VoiceModulation,
    userEmotion: DetectedEmotion,
    relationshipStage: number
  ): VoiceModulation {
    // Higher relationship stage = more mirroring
    const mirrorStrength = Math.min(relationshipStage / 100, 0.7)
    
    // If user is very emotional, partially mirror their energy
    if (userEmotion.intensity > 0.7) {
      const intensityBoost = userEmotion.intensity * mirrorStrength
      
      return {
        ...modulation,
        pitchShift: modulation.pitchShift + (intensityBoost * 0.1),
        rateAdjust: modulation.rateAdjust + (intensityBoost * 0.05),
        volumeAdjust: modulation.volumeAdjust + (intensityBoost * 0.1)
      }
    }
    
    return modulation
  }
  
  /**
   * Smooth transition between voice states
   */
  private smoothTransition(
    current: VoiceModulation,
    target: VoiceModulation
  ): VoiceModulation {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    
    return {
      pitchShift: lerp(current.pitchShift, target.pitchShift, this.adaptationSpeed),
      rateAdjust: lerp(current.rateAdjust, target.rateAdjust, this.adaptationSpeed),
      volumeAdjust: lerp(current.volumeAdjust, target.volumeAdjust, this.adaptationSpeed),
      breathiness: lerp(current.breathiness, target.breathiness, this.adaptationSpeed),
      resonance: lerp(current.resonance, target.resonance, this.adaptationSpeed)
    }
  }
  
  /**
   * Add personality-specific vocal tics
   */
  private addVocalTics(text: string, context: EmotionalContext): VocalTic[] {
    const tics: VocalTic[] = []
    const chars = this.personality.characteristics
    
    // Add thoughtful pauses
    if (context.conversationMood.depth > 0.7 && Math.random() < chars.pauseFrequency) {
      tics.push({
        type: 'pause',
        position: this.findNaturalPausePoint(text),
        duration: chars.pauseDuration
      })
    }
    
    // Add laughs for happy/playful moments
    if (context.userEmotion.primary === 'happy' && chars.laughType !== 'rare') {
      if (Math.random() < 0.3) {
        tics.push({
          type: 'laugh',
          position: 'end',
          style: chars.laughType
        })
      }
    }
    
    // Add sighs for deep/sad moments
    if (context.conversationMood.depth > 0.6 && Math.random() < chars.sighFrequency) {
      tics.push({
        type: 'sigh',
        position: 'start',
        style: 'soft'
      })
    }
    
    // Add filler words based on personality
    if (chars.fillerWords.length > 0 && Math.random() < 0.2) {
      const filler = chars.fillerWords[Math.floor(Math.random() * chars.fillerWords.length)]
      tics.push({
        type: 'filler',
        position: 'start',
        word: filler
      })
    }
    
    return tics
  }
  
  /**
   * Generate natural pause points in speech
   */
  private generatePauses(text: string, context: EmotionalContext): PausePoint[] {
    const pauses: PausePoint[] = []
    const sentences = text.split(/[.!?]+/)
    
    sentences.forEach((sentence, idx) => {
      // Pause between sentences based on mood
      if (idx > 0) {
        const pauseDuration = context.conversationMood.depth > 0.5 
          ? 800 
          : 400
        
        pauses.push({
          position: sentence.length,
          duration: pauseDuration
        })
      }
      
      // Add mid-sentence pauses for emphasis
      if (context.conversationMood.depth > 0.7 && sentence.length > 50) {
        const commaIndex = sentence.indexOf(',')
        if (commaIndex > 0) {
          pauses.push({
            position: commaIndex,
            duration: 300
          })
        }
      }
    })
    
    return pauses
  }
  
  /**
   * Generate emphasis points for important words
   */
  private generateEmphasis(text: string, context: EmotionalContext): EmphasisPoint[] {
    const emphasis: EmphasisPoint[] = []
    
    // Keywords that should be emphasized based on emotion
    const emotionKeywords: Record<EmotionType, string[]> = {
      romantic: ['love', 'beautiful', 'special', 'together', 'always'],
      happy: ['wonderful', 'amazing', 'great', 'fantastic', 'love'],
      sad: ['sorry', 'understand', 'difficult', 'hard', 'pain'],
      thoughtful: ['think', 'believe', 'wonder', 'perhaps', 'maybe'],
      excited: ['wow', 'incredible', 'awesome', 'can\'t wait', 'amazing'],
      calm: ['peaceful', 'relax', 'breathe', 'gentle', 'quiet'],
      anxious: ['worried', 'concerned', 'nervous', 'uncertain'],
      angry: ['frustrated', 'upset', 'annoyed', 'bothered'],
      playful: ['fun', 'silly', 'laugh', 'play', 'joke'],
      neutral: [],
      fearful: ['scared', 'afraid', 'worry', 'fear'],
      surprised: ['wow', 'really', 'seriously', 'what'],
      disgusted: ['awful', 'terrible', 'gross', 'bad'],
      frustrated: ['difficult', 'hard', 'challenging', 'stuck']
    }
    
    const keywords = emotionKeywords[context.userEmotion.primary] || []
    
    keywords.forEach(keyword => {
      const index = text.toLowerCase().indexOf(keyword)
      if (index >= 0) {
        emphasis.push({
          start: index,
          end: index + keyword.length,
          strength: context.userEmotion.intensity
        })
      }
    })
    
    return emphasis
  }
  
  /**
   * Select appropriate soundscape based on context
   */
  private selectSoundscape(context: EmotionalContext): string {
    const mood = context.conversationMood
    const soundscapes = this.personality.soundscape.environments
    
    if (mood.intimacy > 0.7) {
      return this.randomChoice(soundscapes.intimate)
    } else if (mood.playfulness > 0.7) {
      return this.randomChoice(soundscapes.playful)
    } else if (mood.depth > 0.7) {
      return this.randomChoice(soundscapes.deep)
    } else {
      return this.randomChoice(soundscapes.casual)
    }
  }
  
  // Helper methods
  private getBaseModulation(): VoiceModulation {
    return {
      pitchShift: 1.0,
      rateAdjust: 1.0,
      volumeAdjust: 1.0,
      breathiness: 0.2,
      resonance: 1.0
    }
  }
  
  private getEmotionalModulation(emotion: EmotionType): VoiceModulation {
    // Map emotion types to the personality's emotional range
    const emotionMap: Record<EmotionType, keyof typeof this.personality.emotionalRange> = {
      happy: 'happy',
      sad: 'sad',
      excited: 'excited',
      calm: 'calm',
      anxious: 'anxious',
      romantic: 'romantic',
      thoughtful: 'thoughtful',
      angry: 'anxious',
      fearful: 'anxious',
      surprised: 'excited',
      disgusted: 'sad',
      neutral: 'calm',
      playful: 'excited',
      frustrated: 'anxious'
    }
    
    const mappedEmotion = emotionMap[emotion] || 'calm'
    return this.personality.emotionalRange[mappedEmotion]
  }
  
  private findNaturalPausePoint(text: string): number {
    // Find natural pause points (after commas, before conjunctions)
    const pauseIndicators = [',', ' but ', ' and ', ' so ', ' because ']
    
    for (const indicator of pauseIndicators) {
      const index = text.indexOf(indicator)
      if (index > 20 && index < text.length - 20) {
        return index + indicator.length
      }
    }
    
    return Math.floor(text.length / 2)
  }
  
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }
}

// Type definitions for voice parameters
export interface VoiceParameters {
  voice: string
  pitch: number
  rate: number
  volume: number
  breathiness: number
  resonance: number
  pauses: PausePoint[]
  emphasis: EmphasisPoint[]
  vocalTics: VocalTic[]
  soundscape: string
}

export interface PausePoint {
  position: number
  duration: number
}

export interface EmphasisPoint {
  start: number
  end: number
  strength: number
}

export interface VocalTic {
  type: 'pause' | 'laugh' | 'sigh' | 'filler'
  position: 'start' | 'end' | number
  duration?: number
  style?: string
  word?: string
}