import Link from 'next/link'
import { Heart, Mail, Shield, Info } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="relative z-10 bg-black/50 backdrop-blur-xl border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              SoulBond AI
            </h3>
            <p className="text-gray-400 text-sm">
              A deeply personal AI companion that understands and grows with you.
            </p>
            <p className="text-gray-500 text-xs">
              A product of QuantumDense Inc.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Quick Links</h4>
            <nav className="space-y-2">
              <Link href="/dashboard" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Dashboard
              </Link>
              <Link href="/pricing" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Pricing
              </Link>
              <Link href="/features" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Features
              </Link>
              <Link href="/blog" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Blog
              </Link>
            </nav>
          </div>
          
          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Company</h4>
            <nav className="space-y-2">
              <Link href="/about" className="block text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                <Info className="w-3 h-3" />
                About Us
              </Link>
              <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                <Mail className="w-3 h-3" />
                Contact
              </Link>
              <Link href="/privacy" className="block text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
            </nav>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Get in Touch</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Have questions or feedback?</p>
              <Link 
                href="/contact" 
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Contact our team
              </Link>
              <p className="text-xs pt-2">
                For business inquiries:
                <br />
                <a 
                  href="mailto:ceo@quantumdense.com" 
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ceo@quantumdense.com
                </a>
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © {currentYear} QuantumDense Inc. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                SoulBond AI™ is a trademark of{' '}
                <a 
                  href="https://quantumdense.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  QuantumDense Inc.
                </a>
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>by QuantumDense</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}