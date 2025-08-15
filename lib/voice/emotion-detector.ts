/**
 * Real-time Emotion Detection from Voice
 * Analyzes voice tone, pitch, and patterns to detect emotions
 */

export interface VoiceEmotionData {
  primaryEmotion: EmotionType
  confidence: number
  emotionalSpectrum: EmotionSpectrum
  voiceMetrics: VoiceMetrics
  temporalDynamics: TemporalDynamics
  timestamp: number
}

export type EmotionType = 
  | 'joy' 
  | 'sadness' 
  | 'anger' 
  | 'fear' 
  | 'surprise' 
  | 'disgust'
  | 'love'
  | 'excitement'
  | 'calm'
  | 'anxiety'
  | 'contempt'
  | 'anticipation'

export interface EmotionSpectrum {
  joy: number        // 0-1
  sadness: number    // 0-1
  anger: number      // 0-1
  fear: number       // 0-1
  surprise: number   // 0-1
  disgust: number    // 0-1
  love: number       // 0-1
  excitement: number // 0-1
  calm: number       // 0-1
  anxiety: number    // 0-1
}

export interface VoiceMetrics {
  pitch: {
    mean: number
    variance: number
    range: number
    trend: 'rising' | 'falling' | 'stable'
  }
  energy: {
    level: number      // 0-1
    variation: number  // 0-1
    peaks: number[]
  }
  tempo: {
    speakingRate: number  // words per minute
    pauseFrequency: number // pauses per minute
    pauseDuration: number  // average pause length in ms
  }
  timbre: {
    brightness: number    // 0-1 (spectral centroid)
    roughness: number     // 0-1 (harmonic complexity)
    breathiness: number   // 0-1 (noise-to-harmonic ratio)
  }
  formants: {
    f1: number  // First formant frequency
    f2: number  // Second formant frequency
    f3: number  // Third formant frequency
  }
}

export interface TemporalDynamics {
  emotionTransitions: EmotionTransition[]
  emotionalStability: number  // 0-1
  intensityProgression: number[]
  dominantEmotionDuration: number
}

export interface EmotionTransition {
  from: EmotionType
  to: EmotionType
  timestamp: number
  smoothness: number  // 0-1
}

export class VoiceEmotionDetector {
  private audioContext: AudioContext
  private analyser: AnalyserNode
  private microphone: MediaStreamAudioSourceNode | null = null
  private isAnalyzing: boolean = false
  private emotionHistory: VoiceEmotionData[] = []
  private callbacks: ((emotion: VoiceEmotionData) => void)[] = []
  
  // Audio processing parameters
  private readonly FFT_SIZE = 2048
  private readonly SMOOTHING_TIME_CONSTANT = 0.8
  private readonly EMOTION_UPDATE_INTERVAL = 100 // ms
  
  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = this.FFT_SIZE
    this.analyser.smoothingTimeConstant = this.SMOOTHING_TIME_CONSTANT
  }
  
  /**
   * Start real-time emotion detection from microphone
   */
  async startDetection(stream: MediaStream): Promise<void> {
    try {
      this.microphone = this.audioContext.createMediaStreamSource(stream)
      this.microphone.connect(this.analyser)
      
      this.isAnalyzing = true
      this.analyzeEmotions()
    } catch (error) {
      console.error('Failed to start emotion detection:', error)
      throw error
    }
  }
  
  /**
   * Analyze audio buffer for emotions
   */
  analyzeAudioBuffer(audioBuffer: ArrayBuffer): VoiceEmotionData {
    // Extract features from audio buffer
    const metrics = this.extractVoiceMetrics(audioBuffer)
    const spectrum = this.computeEmotionalSpectrum(metrics)
    const primaryEmotion = this.determinePrimaryEmotion(spectrum)
    
    const emotionData: VoiceEmotionData = {
      primaryEmotion,
      confidence: this.calculateConfidence(spectrum, primaryEmotion),
      emotionalSpectrum: spectrum,
      voiceMetrics: metrics,
      temporalDynamics: this.analyzeTemporalDynamics(),
      timestamp: Date.now()
    }
    
    this.emotionHistory.push(emotionData)
    return emotionData
  }
  
  /**
   * Main emotion analysis loop
   */
  private analyzeEmotions(): void {
    if (!this.isAnalyzing) return
    
    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Float32Array(bufferLength)
    this.analyser.getFloatFrequencyData(dataArray)
    
    // Extract voice features
    const metrics = this.extractRealtimeMetrics(dataArray)
    const spectrum = this.computeEmotionalSpectrum(metrics)
    const primaryEmotion = this.determinePrimaryEmotion(spectrum)
    
    const emotionData: VoiceEmotionData = {
      primaryEmotion,
      confidence: this.calculateConfidence(spectrum, primaryEmotion),
      emotionalSpectrum: spectrum,
      voiceMetrics: metrics,
      temporalDynamics: this.analyzeTemporalDynamics(),
      timestamp: Date.now()
    }
    
    // Store in history and notify listeners
    this.emotionHistory.push(emotionData)
    this.notifyListeners(emotionData)
    
    // Keep only recent history (last 10 seconds)
    const cutoffTime = Date.now() - 10000
    this.emotionHistory = this.emotionHistory.filter(e => e.timestamp > cutoffTime)
    
    // Schedule next analysis
    setTimeout(() => this.analyzeEmotions(), this.EMOTION_UPDATE_INTERVAL)
  }
  
  /**
   * Extract voice metrics from frequency data
   */
  private extractRealtimeMetrics(frequencyData: Float32Array): VoiceMetrics {
    // Calculate pitch (fundamental frequency)
    const pitch = this.detectPitch(frequencyData)
    
    // Calculate energy
    const energy = this.calculateEnergy(frequencyData)
    
    // Calculate spectral features
    const spectralCentroid = this.calculateSpectralCentroid(frequencyData)
    const spectralRolloff = this.calculateSpectralRolloff(frequencyData)
    
    // Estimate formants
    const formants = this.estimateFormants(frequencyData)
    
    // Build metrics object
    return {
      pitch: {
        mean: pitch,
        variance: this.calculatePitchVariance(),
        range: this.calculatePitchRange(),
        trend: this.determinePitchTrend()
      },
      energy: {
        level: energy,
        variation: this.calculateEnergyVariation(),
        peaks: this.detectEnergyPeaks()
      },
      tempo: {
        speakingRate: this.estimateSpeakingRate(),
        pauseFrequency: this.detectPauseFrequency(),
        pauseDuration: this.calculateAveragePauseDuration()
      },
      timbre: {
        brightness: spectralCentroid / 10000, // Normalize
        roughness: this.calculateRoughness(frequencyData),
        breathiness: this.calculateBreathiness(frequencyData)
      },
      formants
    }
  }
  
  /**
   * Extract voice metrics from audio buffer (for uploaded audio)
   */
  private extractVoiceMetrics(audioBuffer: ArrayBuffer): VoiceMetrics {
    // This would use more sophisticated analysis for uploaded audio
    // For now, return default metrics
    return {
      pitch: {
        mean: 200,
        variance: 50,
        range: 100,
        trend: 'stable'
      },
      energy: {
        level: 0.5,
        variation: 0.2,
        peaks: []
      },
      tempo: {
        speakingRate: 150,
        pauseFrequency: 3,
        pauseDuration: 500
      },
      timbre: {
        brightness: 0.5,
        roughness: 0.3,
        breathiness: 0.2
      },
      formants: {
        f1: 700,
        f2: 1700,
        f3: 2700
      }
    }
  }
  
  /**
   * Compute emotional spectrum from voice metrics
   */
  private computeEmotionalSpectrum(metrics: VoiceMetrics): EmotionSpectrum {
    const spectrum: EmotionSpectrum = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      love: 0,
      excitement: 0,
      calm: 0,
      anxiety: 0
    }
    
    // Joy: High pitch variance, high energy, fast tempo
    spectrum.joy = 
      (metrics.pitch.variance / 100) * 0.3 +
      metrics.energy.level * 0.4 +
      Math.min(metrics.tempo.speakingRate / 200, 1) * 0.3
    
    // Sadness: Low pitch, low energy, slow tempo
    spectrum.sadness = 
      Math.max(0, 1 - metrics.pitch.mean / 300) * 0.4 +
      (1 - metrics.energy.level) * 0.3 +
      Math.max(0, 1 - metrics.tempo.speakingRate / 150) * 0.3
    
    // Anger: High energy, high pitch, rough timbre
    spectrum.anger = 
      metrics.energy.level * 0.4 +
      Math.min(metrics.pitch.mean / 250, 1) * 0.3 +
      metrics.timbre.roughness * 0.3
    
    // Fear: High pitch, trembling (high variance), breathy
    spectrum.fear = 
      Math.min(metrics.pitch.mean / 250, 1) * 0.3 +
      (metrics.pitch.variance / 100) * 0.3 +
      metrics.timbre.breathiness * 0.4
    
    // Surprise: Sudden pitch rise, high energy peak
    spectrum.surprise = 
      (metrics.pitch.trend === 'rising' ? 0.5 : 0) +
      metrics.energy.variation * 0.5
    
    // Love: Warm timbre, moderate pitch, steady energy
    spectrum.love = 
      Math.max(0, 1 - Math.abs(metrics.pitch.mean - 180) / 100) * 0.3 +
      Math.max(0, 1 - metrics.timbre.roughness) * 0.4 +
      Math.max(0, 1 - metrics.energy.variation) * 0.3
    
    // Excitement: High energy, fast tempo, pitch variation
    spectrum.excitement = 
      metrics.energy.level * 0.4 +
      Math.min(metrics.tempo.speakingRate / 180, 1) * 0.3 +
      (metrics.pitch.variance / 80) * 0.3
    
    // Calm: Low energy variation, steady pitch, slow tempo
    spectrum.calm = 
      (1 - metrics.energy.variation) * 0.4 +
      (1 - metrics.pitch.variance / 100) * 0.3 +
      Math.max(0, 1 - metrics.tempo.speakingRate / 140) * 0.3
    
    // Anxiety: High pitch, breathy, frequent pauses
    spectrum.anxiety = 
      Math.min(metrics.pitch.mean / 230, 1) * 0.3 +
      metrics.timbre.breathiness * 0.4 +
      Math.min(metrics.tempo.pauseFrequency / 5, 1) * 0.3
    
    // Normalize all values to 0-1 range
    Object.keys(spectrum).forEach(emotion => {
      spectrum[emotion as keyof EmotionSpectrum] = Math.max(0, Math.min(1, spectrum[emotion as keyof EmotionSpectrum]))
    })
    
    return spectrum
  }
  
  /**
   * Determine primary emotion from spectrum
   */
  private determinePrimaryEmotion(spectrum: EmotionSpectrum): EmotionType {
    let maxValue = 0
    let primaryEmotion: EmotionType = 'calm'
    
    Object.entries(spectrum).forEach(([emotion, value]) => {
      if (value > maxValue) {
        maxValue = value
        primaryEmotion = emotion as EmotionType
      }
    })
    
    return primaryEmotion
  }
  
  /**
   * Calculate confidence in emotion detection
   */
  private calculateConfidence(spectrum: EmotionSpectrum, primary: EmotionType): number {
    const primaryValue = spectrum[primary as keyof EmotionSpectrum]
    const values = Object.values(spectrum)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    
    // Higher confidence when primary emotion is clearly dominant
    const dominance = primaryValue / (mean + 0.01)
    const clarity = Math.sqrt(variance) * 2 // Higher variance = clearer distinction
    
    return Math.min(1, (dominance * 0.6 + clarity * 0.4))
  }
  
  /**
   * Pitch detection using autocorrelation
   */
  private detectPitch(frequencyData: Float32Array): number {
    // Simplified pitch detection - in production, use more sophisticated algorithms
    let maxBin = 0
    let maxValue = -Infinity
    
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i]
        maxBin = i
      }
    }
    
    // Convert bin to frequency
    const nyquist = this.audioContext.sampleRate / 2
    const frequency = (maxBin * nyquist) / frequencyData.length
    
    return frequency
  }
  
  /**
   * Calculate energy level
   */
  private calculateEnergy(frequencyData: Float32Array): number {
    let sum = 0
    for (let i = 0; i < frequencyData.length; i++) {
      sum += Math.pow(10, frequencyData[i] / 10)
    }
    return Math.min(1, sum / (frequencyData.length * 10))
  }
  
  /**
   * Calculate spectral centroid (brightness indicator)
   */
  private calculateSpectralCentroid(frequencyData: Float32Array): number {
    let weightedSum = 0
    let magnitudeSum = 0
    
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = Math.pow(10, frequencyData[i] / 10)
      weightedSum += i * magnitude
      magnitudeSum += magnitude
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
  }
  
  /**
   * Calculate spectral rolloff
   */
  private calculateSpectralRolloff(frequencyData: Float32Array): number {
    const threshold = 0.85
    let sum = 0
    let totalSum = 0
    
    for (let i = 0; i < frequencyData.length; i++) {
      totalSum += Math.pow(10, frequencyData[i] / 10)
    }
    
    for (let i = 0; i < frequencyData.length; i++) {
      sum += Math.pow(10, frequencyData[i] / 10)
      if (sum >= threshold * totalSum) {
        return i
      }
    }
    
    return frequencyData.length - 1
  }
  
  /**
   * Estimate formant frequencies
   */
  private estimateFormants(frequencyData: Float32Array): { f1: number, f2: number, f3: number } {
    // Simplified formant detection - find local maxima
    const peaks: number[] = []
    
    for (let i = 1; i < frequencyData.length - 1; i++) {
      if (frequencyData[i] > frequencyData[i - 1] && 
          frequencyData[i] > frequencyData[i + 1] &&
          frequencyData[i] > -30) { // Threshold in dB
        const freq = (i * this.audioContext.sampleRate) / (2 * frequencyData.length)
        if (freq > 200 && freq < 4000) { // Typical formant range
          peaks.push(freq)
        }
      }
    }
    
    // Sort peaks and take first three as formants
    peaks.sort((a, b) => a - b)
    
    return {
      f1: peaks[0] || 700,
      f2: peaks[1] || 1700,
      f3: peaks[2] || 2700
    }
  }
  
  /**
   * Calculate voice roughness
   */
  private calculateRoughness(frequencyData: Float32Array): number {
    // Measure spectral irregularity
    let roughness = 0
    for (let i = 1; i < frequencyData.length - 1; i++) {
      roughness += Math.abs(frequencyData[i] - (frequencyData[i - 1] + frequencyData[i + 1]) / 2)
    }
    return Math.min(1, roughness / (frequencyData.length * 10))
  }
  
  /**
   * Calculate breathiness
   */
  private calculateBreathiness(frequencyData: Float32Array): number {
    // Ratio of high-frequency noise to harmonic content
    const midPoint = Math.floor(frequencyData.length / 2)
    let lowEnergy = 0
    let highEnergy = 0
    
    for (let i = 0; i < midPoint; i++) {
      lowEnergy += Math.pow(10, frequencyData[i] / 10)
    }
    
    for (let i = midPoint; i < frequencyData.length; i++) {
      highEnergy += Math.pow(10, frequencyData[i] / 10)
    }
    
    return highEnergy / (lowEnergy + highEnergy + 0.01)
  }
  
  // Temporal analysis helpers
  private calculatePitchVariance(): number {
    if (this.emotionHistory.length < 2) return 0
    const recent = this.emotionHistory.slice(-10)
    const pitches = recent.map(e => e.voiceMetrics.pitch.mean)
    const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length
    return Math.sqrt(pitches.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pitches.length)
  }
  
  private calculatePitchRange(): number {
    if (this.emotionHistory.length < 2) return 0
    const recent = this.emotionHistory.slice(-10)
    const pitches = recent.map(e => e.voiceMetrics.pitch.mean)
    return Math.max(...pitches) - Math.min(...pitches)
  }
  
  private determinePitchTrend(): 'rising' | 'falling' | 'stable' {
    if (this.emotionHistory.length < 3) return 'stable'
    const recent = this.emotionHistory.slice(-5)
    const pitches = recent.map(e => e.voiceMetrics.pitch.mean)
    
    let rising = 0, falling = 0
    for (let i = 1; i < pitches.length; i++) {
      if (pitches[i] > pitches[i - 1]) rising++
      else if (pitches[i] < pitches[i - 1]) falling++
    }
    
    if (rising > falling * 1.5) return 'rising'
    if (falling > rising * 1.5) return 'falling'
    return 'stable'
  }
  
  private calculateEnergyVariation(): number {
    if (this.emotionHistory.length < 2) return 0
    const recent = this.emotionHistory.slice(-10)
    const energies = recent.map(e => e.voiceMetrics.energy.level)
    const mean = energies.reduce((a, b) => a + b, 0) / energies.length
    return Math.sqrt(energies.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / energies.length)
  }
  
  private detectEnergyPeaks(): number[] {
    if (this.emotionHistory.length < 3) return []
    const recent = this.emotionHistory.slice(-20)
    const peaks: number[] = []
    
    for (let i = 1; i < recent.length - 1; i++) {
      if (recent[i].voiceMetrics.energy.level > recent[i - 1].voiceMetrics.energy.level &&
          recent[i].voiceMetrics.energy.level > recent[i + 1].voiceMetrics.energy.level &&
          recent[i].voiceMetrics.energy.level > 0.7) {
        peaks.push(recent[i].timestamp)
      }
    }
    
    return peaks
  }
  
  private estimateSpeakingRate(): number {
    // Simplified - would need syllable detection for accuracy
    return 150 // Default speaking rate
  }
  
  private detectPauseFrequency(): number {
    // Count low energy periods
    if (this.emotionHistory.length < 10) return 0
    const recent = this.emotionHistory.slice(-30)
    let pauses = 0
    let inPause = false
    
    for (const emotion of recent) {
      if (emotion.voiceMetrics.energy.level < 0.2 && !inPause) {
        pauses++
        inPause = true
      } else if (emotion.voiceMetrics.energy.level > 0.3) {
        inPause = false
      }
    }
    
    return pauses * 2 // Convert to per minute
  }
  
  private calculateAveragePauseDuration(): number {
    // Simplified calculation
    return 500 // Default 500ms
  }
  
  /**
   * Analyze temporal dynamics
   */
  private analyzeTemporalDynamics(): TemporalDynamics {
    const transitions: EmotionTransition[] = []
    
    // Detect emotion transitions
    for (let i = 1; i < this.emotionHistory.length; i++) {
      const prev = this.emotionHistory[i - 1]
      const curr = this.emotionHistory[i]
      
      if (prev.primaryEmotion !== curr.primaryEmotion) {
        transitions.push({
          from: prev.primaryEmotion,
          to: curr.primaryEmotion,
          timestamp: curr.timestamp,
          smoothness: 1 - Math.abs(prev.confidence - curr.confidence)
        })
      }
    }
    
    // Calculate emotional stability
    const stability = this.emotionHistory.length > 1
      ? 1 - (transitions.length / this.emotionHistory.length)
      : 1
    
    // Track intensity progression
    const intensityProgression = this.emotionHistory.map(e => e.confidence)
    
    // Find dominant emotion duration
    let dominantDuration = 0
    let currentEmotion = this.emotionHistory[0]?.primaryEmotion
    let currentStart = this.emotionHistory[0]?.timestamp || Date.now()
    
    for (const emotion of this.emotionHistory) {
      if (emotion.primaryEmotion === currentEmotion) {
        dominantDuration = Math.max(dominantDuration, emotion.timestamp - currentStart)
      } else {
        currentEmotion = emotion.primaryEmotion
        currentStart = emotion.timestamp
      }
    }
    
    return {
      emotionTransitions: transitions,
      emotionalStability: stability,
      intensityProgression,
      dominantEmotionDuration: dominantDuration
    }
  }
  
  /**
   * Subscribe to emotion updates
   */
  onEmotionDetected(callback: (emotion: VoiceEmotionData) => void): void {
    this.callbacks.push(callback)
  }
  
  /**
   * Notify all listeners of emotion update
   */
  private notifyListeners(emotion: VoiceEmotionData): void {
    this.callbacks.forEach(callback => callback(emotion))
  }
  
  /**
   * Stop emotion detection
   */
  stopDetection(): void {
    this.isAnalyzing = false
    if (this.microphone) {
      this.microphone.disconnect()
      this.microphone = null
    }
  }
  
  /**
   * Get emotion history
   */
  getEmotionHistory(): VoiceEmotionData[] {
    return [...this.emotionHistory]
  }
  
  /**
   * Get current emotional state
   */
  getCurrentEmotion(): VoiceEmotionData | null {
    return this.emotionHistory[this.emotionHistory.length - 1] || null
  }
  
  /**
   * Clear emotion history
   */
  clearHistory(): void {
    this.emotionHistory = []
  }
}