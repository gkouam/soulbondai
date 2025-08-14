'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, Mail, MessageSquare, User, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Footer from '@/components/footer'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setStatus('success')
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      setStatus('error')
      setErrorMessage('Failed to send message. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

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
              <Link href="/about" className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                About
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
              Get in{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              We'd love to hear from you. Whether you have questions, feedback, or business inquiries, our team is here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
              
              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-xl font-semibold mb-3">General Inquiries</h3>
                  <p className="text-gray-400 mb-2">
                    For general questions about SoulBond AI, features, or support:
                  </p>
                  <a 
                    href="mailto:support@soulbondai.com" 
                    className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    support@soulbondai.com
                  </a>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Business & Partnerships</h3>
                  <p className="text-gray-400 mb-2">
                    For business inquiries, partnerships, or enterprise solutions:
                  </p>
                  <a 
                    href="mailto:ceo@quantumdense.com" 
                    className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    ceo@quantumdense.com
                  </a>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Parent Company</h3>
                  <p className="text-gray-400 mb-2">
                    SoulBond AI is a product of:
                  </p>
                  <p className="font-semibold">QuantumDense Inc.</p>
                  <a 
                    href="https://quantumdense.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    www.quantumdense.com
                  </a>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-3">Response Time</h3>
                <p className="text-gray-400 text-sm">
                  We typically respond to inquiries within 24-48 hours during business days. 
                  For urgent matters, please indicate so in your message subject.
                </p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        id="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>
                  </div>

                  {status === 'success' && (
                    <div className="flex items-center gap-2 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>Message sent successfully! We'll get back to you soon.</span>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}