import Link from "next/link"

export function AuthFooter() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="absolute bottom-0 left-0 right-0 py-6 px-4 text-center">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-gray-400">
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <span className="text-gray-600">•</span>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
          <span className="text-gray-600">•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span className="text-gray-600">•</span>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <span className="text-gray-600">•</span>
          <Link href="/cookies" className="hover:text-white transition-colors">
            Cookies
          </Link>
        </div>
        
        {/* Copyright */}
        <div className="text-xs text-gray-500">
          <p>© {currentYear} SoulBond AI. All rights reserved.</p>
          <p className="mt-1">
            A product of{" "}
            <a 
              href="https://quantumdense.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              QuantumDense Inc.
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}