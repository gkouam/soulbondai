import { calculatePersonalityScores, determineArchetype } from '@/lib/personality-scorer'

describe('PersonalityScorer', () => {
  describe('calculatePersonalityScores', () => {
    it('should calculate scores correctly for anxious romantic profile', () => {
      const answers = [
        { traits: { introversion: 2, comfort_seeking: 1 } },
        { traits: { feeling: 2, connection_seeking: 2 } },
        { traits: { feeling: 2, empathetic: 2 } },
        { traits: { introversion: 1, intimate: 2 } },
        { traits: { neuroticism: 1, anxious: 1 } },
      ]

      const scores = calculatePersonalityScores(answers)
      
      expect(scores.introversion_extraversion).toBeLessThan(0)
      expect(scores.thinking_feeling).toBeGreaterThan(0)
      expect(scores.secure_insecure).toBeLessThan(0)
    })

    it('should calculate scores correctly for guarded intellectual profile', () => {
      const answers = [
        { traits: { extraversion: 2, openness: 2 } },
        { traits: { thinking: 2, analytical: 2 } },
        { traits: { thinking: 2, intellectual: 2 } },
        { traits: { extraversion: 2, social: 2 } },
        { traits: { stable: 2, secure: 2 } },
      ]

      const scores = calculatePersonalityScores(answers)
      
      expect(scores.introversion_extraversion).toBeGreaterThan(0)
      expect(scores.thinking_feeling).toBeLessThan(0)
      expect(scores.stable_neurotic).toBeGreaterThan(0)
    })
  })

  describe('determineArchetype', () => {
    it('should identify anxious_romantic archetype', () => {
      const scores = {
        introversion_extraversion: -2,
        thinking_feeling: 5,
        intuitive_sensing: 0,
        judging_perceiving: 0,
        stable_neurotic: -3,
        secure_insecure: -4,
        independent_dependent: 3,
        attachment_style: 'anxious' as const,
        emotional_depth: 8,
        communication_openness: 7,
        intimacy_comfort: 6,
        support_needs: 9,
        fantasy_preference: 7,
      }

      const archetype = determineArchetype(scores)
      expect(archetype).toBe('anxious_romantic')
    })

    it('should identify guarded_intellectual archetype', () => {
      const scores = {
        introversion_extraversion: -3,
        thinking_feeling: -5,
        intuitive_sensing: -2,
        judging_perceiving: 2,
        stable_neurotic: 2,
        secure_insecure: -4,
        independent_dependent: -5,
        attachment_style: 'avoidant' as const,
        emotional_depth: 4,
        communication_openness: 3,
        intimacy_comfort: 2,
        support_needs: 2,
        fantasy_preference: 5,
      }

      const archetype = determineArchetype(scores)
      expect(archetype).toBe('guarded_intellectual')
    })

    it('should identify warm_empath archetype', () => {
      const scores = {
        introversion_extraversion: 4,
        thinking_feeling: 4,
        intuitive_sensing: 1,
        judging_perceiving: 0,
        stable_neurotic: 3,
        secure_insecure: 4,
        independent_dependent: 0,
        attachment_style: 'secure' as const,
        emotional_depth: 7,
        communication_openness: 8,
        intimacy_comfort: 8,
        support_needs: 5,
        fantasy_preference: 6,
      }

      const archetype = determineArchetype(scores)
      expect(archetype).toBe('warm_empath')
    })
  })
})