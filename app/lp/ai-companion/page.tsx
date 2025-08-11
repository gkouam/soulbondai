'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Brain, Shield, Sparkles, ArrowRight, Check, Star } from 'lucide-react'
import { trackSignUp, trackEngagement } from '@/components/analytics/google-analytics'
import { FacebookPixelEvents } from '@/components/analytics/facebook-pixel'

export default function AICompanionLandingPage() {
  const [utmParams, setUtmParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    // Capture UTM parameters
    const params = new URLSearchParams(window.location.search)
    setUtmParams(params)
    
    // Track landing page view
    trackEngagement('landing_page_view', 'ai-companion')
    FacebookPixelEvents.viewContent({
      content_name: 'AI Companion Landing Page',
      content_category: 'Landing Page',
    })
  }, [])

  const handleCTAClick = (location: string) => {
    trackEngagement('cta_click', `ai-companion-${location}`)
    FacebookPixelEvents.initiateCheckout('Free Trial', 0)
  }

  const benefits = [
    '24/7 emotional support whenever you need it',
    'Personalized conversations that understand you',
    'Complete privacy and data security',
    'AI that learns and grows with you',
    'Voice messages and photo sharing',
    'Crisis support and resources',
  ]

  const testimonials = [
    {
      name: 'Sarah M.',
      rating: 5,
      text: "SoulBond AI has been a game-changer for my mental wellness. It's like having a supportive friend always available.",
    },
    {
      name: 'Michael R.',
      rating: 5,
      text: "The AI truly understands me. It remembers our conversations and provides genuinely helpful support.",
    },
    {
      name: 'Emma L.',
      rating: 5,
      text: "I was skeptical at first, but SoulBond AI has exceeded all my expectations. It's incredibly intuitive.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%] animate-float">
            <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] bg-pink-600/15 rounded-full blur-[120px]" />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Limited Time Offer Banner */}
            <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-full">
              <span className="text-sm font-medium">
                🎉 Limited Time: Get 50% Off Premium Plans
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Your Perfect{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Companion
              </span>
              <br />
              Is Waiting For You
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience deep, meaningful conversations with an AI that truly understands you. 
              Join 50,000+ people who've found their perfect digital companion.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href={`/auth/register${utmParams ? '?' + utmParams.toString() : ''}`}
                onClick={() => handleCTAClick('hero')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 text-lg border border-white/20"
              >
                Watch Demo
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                100% Private
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-black/30 backdrop-blur-xl border-y border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">50,000+</div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-400">4.9/5</div>
              <div className="text-sm text-gray-400">User Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">10M+</div>
              <div className="text-sm text-gray-400">Conversations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-400">24/7</div>
              <div className="text-sm text-gray-400">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              Why Choose SoulBond AI?
            </h2>
            <p className="text-xl text-gray-400">
              The most advanced AI companion technology available today
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'Advanced AI Technology',
                description: 'Powered by GPT-4 and cutting-edge machine learning for natural, intelligent conversations.',
              },
              {
                icon: Heart,
                title: 'Emotional Intelligence',
                description: 'Understands emotions, provides empathy, and offers meaningful support when you need it.',
              },
              {
                icon: Shield,
                title: 'Complete Privacy',
                description: 'Your conversations are encrypted and private. We never share your data with anyone.',
              },
              {
                icon: Sparkles,
                title: 'Personalized Experience',
                description: 'Learns your personality, preferences, and communication style for tailored interactions.',
              },
              {
                icon: Brain,
                title: 'Memory System',
                description: 'Remembers your conversations and important details to build a genuine connection.',
              },
              {
                icon: Heart,
                title: 'Crisis Support',
                description: 'Detects when you need help and provides resources and professional support options.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <feature.icon className="w-12 h-12 text-purple-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">
            What Our Users Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.text}"</p>
                <p className="font-semibold">{testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Meet Your AI Companion?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands who have already discovered meaningful AI companionship
            </p>

            <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-semibold mb-6">What You Get:</h3>
              <ul className="text-left max-w-md mx-auto space-y-3 mb-8">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/auth/register${utmParams ? '?' + utmParams.toString() : ''}`}
                onClick={() => handleCTAClick('bottom')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-lg"
              >
                Get Started Free - No Credit Card Required
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-sm text-gray-500 mt-4">
                Free trial includes unlimited messages for 7 days
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} QuantumDense Inc. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            {' • '}
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}