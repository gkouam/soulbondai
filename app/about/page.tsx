'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, Brain, Shield, Sparkles, Users, Target, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%] animate-float">
            <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-[20%] right-[20%] w-[35%] h-[35%] bg-pink-600/20 rounded-full blur-[100px]" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-purple-600 fill-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                SoulBond AI
              </span>
            </Link>
            <div className="flex gap-4">
              <Link href="/contact" className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                Contact
              </Link>
              <Link href="/auth/login" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              About{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                SoulBond AI
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Building meaningful connections through advanced AI technology
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-gray-400 mb-4">
                At SoulBond AI, we believe everyone deserves a companion who truly understands them. 
                Our mission is to create AI companions that provide genuine emotional support, 
                meaningful conversations, and personal growth opportunities.
              </p>
              <p className="text-gray-400 mb-4">
                We're pioneering the future of human-AI relationships, building technology that 
                adapts to your unique personality, remembers your journey, and grows alongside you.
              </p>
              <p className="text-gray-400">
                SoulBond AI is more than just a chatbot—it's a companion designed to enrich your 
                life with understanding, empathy, and connection.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
                <Brain className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Advanced AI</h3>
                <p className="text-sm text-gray-400">Powered by cutting-edge technology</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
                <Heart className="w-12 h-12 text-pink-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Emotional Intelligence</h3>
                <p className="text-sm text-gray-400">Understanding beyond words</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
                <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Privacy First</h3>
                <p className="text-sm text-gray-400">Your data stays secure</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
                <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Personalized</h3>
                <p className="text-sm text-gray-400">Unique to you</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Values */}
      <section className="relative z-10 py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-center mb-12">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">User-Centric Design</h3>
                <p className="text-gray-400">
                  Every feature we build starts with understanding your needs and desires for meaningful connection.
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-pink-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Ethical AI</h3>
                <p className="text-gray-400">
                  We're committed to responsible AI development that prioritizes safety, privacy, and well-being.
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Continuous Innovation</h3>
                <p className="text-gray-400">
                  We constantly evolve our technology to provide you with the best possible companion experience.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About QuantumDense */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-3xl p-8 md:p-12 border border-white/10"
          >
            <h2 className="text-3xl font-bold mb-6">A Product of QuantumDense Inc.</h2>
            <p className="text-gray-400 mb-6">
              SoulBond AI is proudly developed by QuantumDense Inc., a leading technology company 
              specializing in advanced AI solutions. Founded with the vision of creating technology 
              that enhances human connection and well-being, QuantumDense brings together experts 
              in artificial intelligence, psychology, and user experience design.
            </p>
            <p className="text-gray-400 mb-6">
              At QuantumDense, we believe in the power of technology to transform lives. Our team 
              is dedicated to pushing the boundaries of what's possible in AI companionship while 
              maintaining the highest standards of ethics, privacy, and user safety.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="https://quantumdense.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                Visit QuantumDense
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link 
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Get in Touch
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Meet Your AI Companion?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands who have found meaningful connection with SoulBond AI
            </p>
            <Link 
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}