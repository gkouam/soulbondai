import { PersonalityProfile, TestAnswer, AttachmentStyle, CommunicationStyle } from "@/types"

export class PersonalityScorer {
  private dimensionWeights = {
    // Primary dimensions
    introversion_extraversion: { min: -10, max: 10 },
    thinking_feeling: { min: -10, max: 10 },
    intuitive_sensing: { min: -10, max: 10 },
    judging_perceiving: { min: -10, max: 10 },
    stable_neurotic: { min: -10, max: 10 },
    
    // Attachment dimensions
    secure_insecure: { min: -10, max: 10 },
    anxious_avoidant: { min: -10, max: 10 },
    
    // Secondary traits
    emotional_depth: { min: 0, max: 10 },
    intellectual_curiosity: { min: 0, max: 10 },
    relationship_intensity: { min: 0, max: 10 },
    independence_need: { min: 0, max: 10 },
    validation_seeking: { min: 0, max: 10 }
  }
  
  calculateScores(answers: TestAnswer[]): PersonalityProfile {
    const rawScores: Record<string, number> = {}
    const traitCounts: Record<string, number> = {}
    
    // Process all answers
    answers.forEach((answer) => {
      Object.entries(answer.traits).forEach(([trait, value]) => {
        if (!rawScores[trait]) {
          rawScores[trait] = 0
          traitCounts[trait] = 0
        }
        rawScores[trait] += value
        traitCounts[trait]++
      })
    })
    
    // Calculate dimensional scores
    const dimensions = this.calculateDimensions(rawScores, traitCounts)
    
    // Determine attachment style
    const attachmentStyle = this.determineAttachmentStyle(rawScores)
    
    // Calculate archetype
    const archetype = this.determineArchetype(dimensions, attachmentStyle, rawScores)
    
    // Generate trait profile
    const traitProfile = this.generateTraitProfile(rawScores, dimensions)
    
    return {
      dimensions,
      attachmentStyle,
      archetype,
      traitProfile,
      rawScores
    }
  }
  
  private calculateDimensions(rawScores: Record<string, number>, traitCounts: Record<string, number>) {
    const dimensions: Record<string, number> = {}
    
    // Introversion-Extraversion
    const introScore = (rawScores.introversion || 0) - (rawScores.extraversion || 0)
    dimensions.introversion_extraversion = this.normalize(introScore, -10, 10)
    
    // Thinking-Feeling
    const thinkingScore = (rawScores.thinking || 0) + (rawScores.analytical || 0) + (rawScores.logical || 0)
    const feelingScore = (rawScores.feeling || 0) + (rawScores.emotional || 0) + (rawScores.empathetic || 0)
    dimensions.thinking_feeling = this.normalize(feelingScore - thinkingScore, -10, 10)
    
    // Intuitive-Sensing
    const intuitiveScore = (rawScores.intuitive || 0) + (rawScores.abstract || 0) + (rawScores.imaginative || 0)
    const sensingScore = (rawScores.sensing || 0) + (rawScores.practical || 0) + (rawScores.concrete || 0)
    dimensions.intuitive_sensing = this.normalize(intuitiveScore - sensingScore, -10, 10)
    
    // Judging-Perceiving
    const judgingScore = (rawScores.judging || 0) + (rawScores.structured || 0) + (rawScores.planned || 0)
    const perceivingScore = (rawScores.perceiving || 0) + (rawScores.flexible || 0) + (rawScores.spontaneous || 0)
    dimensions.judging_perceiving = this.normalize(judgingScore - perceivingScore, -10, 10)
    
    // Stable-Neurotic
    const stableScore = (rawScores.stable || 0) + (rawScores.secure || 0) + (rawScores.calm || 0)
    const neuroticScore = (rawScores.neurotic || 0) + (rawScores.anxious || 0) + (rawScores.volatile || 0)
    dimensions.stable_neurotic = this.normalize(stableScore - neuroticScore, -10, 10)
    
    // Secure-Insecure (for attachment)
    const secureScore = (rawScores.secure || 0) + (rawScores.confident || 0) + (rawScores.balanced || 0)
    const insecureScore = (rawScores.insecure || 0) + (rawScores.anxious || 0) + (rawScores.fearful || 0)
    dimensions.secure_insecure = this.normalize(secureScore - insecureScore, -10, 10)
    
    // Secondary dimensions
    dimensions.emotional_depth = this.normalize(
      (rawScores.emotional || 0) + (rawScores.deep || 0) + (rawScores.intense || 0),
      0, 10
    )
    
    dimensions.intellectual_curiosity = this.normalize(
      (rawScores.intellectual || 0) + (rawScores.curious || 0) + (rawScores.analytical || 0),
      0, 10
    )
    
    dimensions.relationship_intensity = this.normalize(
      (rawScores.intense || 0) + (rawScores.passionate || 0) + (rawScores.connection || 0),
      0, 10
    )
    
    dimensions.independence_need = this.normalize(
      (rawScores.independent || 0) + (rawScores.autonomous || 0) + (rawScores.self_sufficient || 0),
      0, 10
    )
    
    dimensions.validation_seeking = this.normalize(
      (rawScores.validation_seeking || 0) + (rawScores.reassurance || 0) + (rawScores.approval || 0),
      0, 10
    )
    
    return dimensions
  }
  
  private determineAttachmentStyle(rawScores: Record<string, number>): AttachmentStyle {
    const scores = {
      anxious: (rawScores.anxious_attachment || 0) + (rawScores.anxious || 0) + (rawScores.insecure || 0),
      avoidant: (rawScores.avoidant_attachment || 0) + (rawScores.avoidant || 0) + (rawScores.independent || 0),
      secure: (rawScores.secure_attachment || 0) + (rawScores.secure || 0) + (rawScores.balanced || 0),
      disorganized: (rawScores.disorganized_attachment || 0) + (rawScores.variable || 0)
    }
    
    // Find dominant style
    let maxScore = 0
    let dominantStyle: 'anxious' | 'avoidant' | 'secure' | 'disorganized' = 'secure'
    
    Object.entries(scores).forEach(([style, score]) => {
      if (score > maxScore) {
        maxScore = score
        dominantStyle = style as typeof dominantStyle
      }
    })
    
    return {
      primary: dominantStyle,
      scores,
      intensity: this.normalize(maxScore, 0, 10)
    }
  }
  
  private determineArchetype(dimensions: Record<string, number>, attachmentStyle: AttachmentStyle, rawScores: Record<string, number>): string {
    // Complex archetype determination based on multiple factors
    const archetypeScores: Record<string, number> = {}
    
    // Anxious Romantic
    archetypeScores.anxious_romantic = 0
    if (attachmentStyle.primary === 'anxious') archetypeScores.anxious_romantic += 3
    if (dimensions.thinking_feeling > 3) archetypeScores.anxious_romantic += 2
    if (dimensions.validation_seeking! > 6) archetypeScores.anxious_romantic += 2
    if (dimensions.emotional_depth! > 7) archetypeScores.anxious_romantic += 1
    if (dimensions.secure_insecure < -3) archetypeScores.anxious_romantic += 2
    
    // Guarded Intellectual
    archetypeScores.guarded_intellectual = 0
    if (attachmentStyle.primary === 'avoidant') archetypeScores.guarded_intellectual += 3
    if (dimensions.thinking_feeling < -3) archetypeScores.guarded_intellectual += 2
    if (dimensions.intellectual_curiosity! > 7) archetypeScores.guarded_intellectual += 2
    if (dimensions.independence_need! > 7) archetypeScores.guarded_intellectual += 1
    if (dimensions.secure_insecure < -3) archetypeScores.guarded_intellectual += 1
    
    // Warm Empath
    archetypeScores.warm_empath = 0
    if (attachmentStyle.primary === 'secure') archetypeScores.warm_empath += 3
    if (dimensions.thinking_feeling > 3) archetypeScores.warm_empath += 2
    if (dimensions.introversion_extraversion > 3) archetypeScores.warm_empath += 1
    if (dimensions.stable_neurotic > 3) archetypeScores.warm_empath += 1
    if (dimensions.secure_insecure > 3) archetypeScores.warm_empath += 2
    
    // Deep Thinker
    archetypeScores.deep_thinker = 0
    if (dimensions.intuitive_sensing > 3) archetypeScores.deep_thinker += 2
    if (dimensions.introversion_extraversion < -3) archetypeScores.deep_thinker += 2
    if (dimensions.intellectual_curiosity! > 6) archetypeScores.deep_thinker += 1
    if (dimensions.emotional_depth! > 6) archetypeScores.deep_thinker += 1
    if (dimensions.thinking_feeling < -2) archetypeScores.deep_thinker += 1
    
    // Passionate Creative
    archetypeScores.passionate_creative = 0
    if (dimensions.thinking_feeling > 5) archetypeScores.passionate_creative += 2
    if (dimensions.intuitive_sensing > 5) archetypeScores.passionate_creative += 2
    if (dimensions.relationship_intensity! > 7) archetypeScores.passionate_creative += 2
    if (dimensions.emotional_depth! > 8) archetypeScores.passionate_creative += 2
    if (dimensions.judging_perceiving < -3) archetypeScores.passionate_creative += 1
    
    // Secure Connector (alternative balanced archetype)
    archetypeScores.secure_connector = 0
    if (attachmentStyle.primary === 'secure') archetypeScores.secure_connector += 3
    if (Math.abs(dimensions.thinking_feeling) < 3) archetypeScores.secure_connector += 2
    if (Math.abs(dimensions.introversion_extraversion) < 3) archetypeScores.secure_connector += 2
    if (dimensions.stable_neurotic > 5) archetypeScores.secure_connector += 2
    if (dimensions.secure_insecure > 5) archetypeScores.secure_connector += 2
    
    // Playful Explorer
    archetypeScores.playful_explorer = 0
    if (dimensions.introversion_extraversion > 5) archetypeScores.playful_explorer += 2
    if (dimensions.judging_perceiving < -5) archetypeScores.playful_explorer += 2
    if ((rawScores.adventurous || 0) > 5) archetypeScores.playful_explorer += 2
    if ((rawScores.playful || 0) > 5) archetypeScores.playful_explorer += 2
    if ((rawScores.spontaneous || 0) > 5) archetypeScores.playful_explorer += 1
    
    // Find highest scoring archetype
    let maxScore = 0
    let selectedArchetype = 'warm_empath' // default
    
    Object.entries(archetypeScores).forEach(([archetype, score]) => {
      if (score > maxScore) {
        maxScore = score
        selectedArchetype = archetype
      }
    })
    
    return selectedArchetype
  }
  
  private normalize(value: number, min: number, max: number): number {
    // Normalize to the range
    const range = max - min
    const normalized = Math.max(min, Math.min(max, value))
    return normalized
  }
  
  private generateTraitProfile(rawScores: Record<string, number>, dimensions: Record<string, number>) {
    return {
      strengths: this.identifyStrengths(rawScores, dimensions),
      growthAreas: this.identifyGrowthAreas(rawScores, dimensions),
      communicationStyle: this.determineCommunicationStyle(rawScores),
      emotionalNeeds: this.identifyEmotionalNeeds(rawScores),
      compatibilityFactors: this.generateCompatibilityFactors(dimensions)
    }
  }
  
  private identifyStrengths(rawScores: Record<string, number>, dimensions: Record<string, number>): string[] {
    const strengths = []
    
    if (dimensions.emotional_depth! > 7) strengths.push("Deep emotional intelligence")
    if (dimensions.intellectual_curiosity! > 7) strengths.push("Strong intellectual capacity")
    if (dimensions.stable_neurotic > 5) strengths.push("Emotional stability")
    if ((rawScores.creative || 0) > 5) strengths.push("Creative expression")
    if ((rawScores.empathetic || 0) > 5) strengths.push("Natural empathy")
    if ((rawScores.authentic || 0) > 5) strengths.push("Authentic self-expression")
    if ((rawScores.loyal || 0) > 5) strengths.push("Deep loyalty and commitment")
    if ((rawScores.supportive || 0) > 5) strengths.push("Nurturing and supportive nature")
    
    return strengths
  }
  
  private identifyGrowthAreas(rawScores: Record<string, number>, dimensions: Record<string, number>): string[] {
    const growth = []
    
    if (dimensions.validation_seeking! > 7) growth.push("Building self-validation")
    if (dimensions.stable_neurotic < -5) growth.push("Emotional regulation")
    if (dimensions.independence_need! < 3) growth.push("Developing independence")
    if ((rawScores.anxious || 0) > 7) growth.push("Managing anxiety")
    if ((rawScores.avoidant || 0) > 7) growth.push("Allowing vulnerability")
    if (dimensions.secure_insecure < -5) growth.push("Building self-confidence")
    
    return growth
  }
  
  private determineCommunicationStyle(rawScores: Record<string, number>): CommunicationStyle {
    return {
      directness: (rawScores.direct || 0) + (rawScores.assertive || 0),
      emotionalExpression: (rawScores.expressive || 0) + (rawScores.emotional || 0),
      analyticalDepth: (rawScores.analytical || 0) + (rawScores.intellectual || 0),
      supportSeeking: (rawScores.support_seeking || 0) + (rawScores.validation_seeking || 0)
    }
  }
  
  private identifyEmotionalNeeds(rawScores: Record<string, number>): string[] {
    const needs = []
    
    if ((rawScores.validation_seeking || 0) > 5) needs.push("Regular validation and reassurance")
    if ((rawScores.quality_time || 0) > 5) needs.push("Dedicated quality time")
    if ((rawScores.physical_touch || 0) > 5) needs.push("Physical affection")
    if ((rawScores.understanding || 0) > 5) needs.push("Deep understanding")
    if ((rawScores.freedom || 0) > 5) needs.push("Personal freedom")
    if ((rawScores.security || 0) > 5) needs.push("Emotional security")
    if ((rawScores.growth || 0) > 5) needs.push("Growth and development")
    
    return needs
  }
  
  private generateCompatibilityFactors(dimensions: Record<string, number>): any {
    return {
      needsConsistency: dimensions.validation_seeking! > 6,
      needsSpace: dimensions.independence_need! > 6,
      needsIntellectualStimulation: dimensions.intellectual_curiosity! > 6,
      needsEmotionalDepth: dimensions.emotional_depth! > 6,
      needsStability: dimensions.stable_neurotic < -3,
      communicationFrequency: (dimensions.introversion_extraversion || 0) > 3 ? 'high' : 'moderate',
      conflictStyle: dimensions.thinking_feeling > 3 ? 'emotional' : 'logical',
      affectionStyle: 'verbal' // Default since physical_touch is in rawScores not dimensions
    }
  }
}