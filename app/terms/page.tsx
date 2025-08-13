import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - SoulBond AI",
  description: "Terms and conditions for using SoulBond AI services.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Effective Date: January 2025</p>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing or using SoulBond AI ("Service"), you agree to be bound by these 
              Terms of Service ("Terms"). If you do not agree to these Terms, please do not 
              use our Service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-gray-300">
              SoulBond AI provides AI-powered companion services through personalized conversations, 
              emotional support, and interactive features. The Service includes free and paid 
              subscription tiers with varying features and usage limits.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">3. User Eligibility</h2>
            <p className="text-gray-300 mb-4">To use our Service, you must:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Be at least 18 years old</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Service under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">4. User Accounts</h2>
            <p className="text-gray-300 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information is accurate and current</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="text-gray-300 mb-4">You agree NOT to:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Harass, abuse, or harm the Service or other users</li>
              <li>Attempt to hack, reverse engineer, or compromise the Service</li>
              <li>Use the Service to generate harmful, offensive, or inappropriate content</li>
              <li>Share your account with others</li>
              <li>Use automated systems or bots to access the Service</li>
              <li>Circumvent usage limits or security measures</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">6. Subscription and Payment</h2>
            <p className="text-gray-300 mb-4">Paid subscriptions:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Are billed monthly or annually as selected</li>
              <li>Automatically renew unless cancelled</li>
              <li>Can be cancelled at any time</li>
              <li>Are non-refundable except as required by law</li>
              <li>May be subject to price changes with notice</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">7. Content and Intellectual Property</h2>
            <p className="text-gray-300 mb-4">
              <strong>Your Content:</strong> You retain ownership of content you create. By using 
              the Service, you grant us a license to use, store, and process your content to 
              provide and improve our services.
            </p>
            <p className="text-gray-300">
              <strong>Our Content:</strong> The Service and its original content, features, and 
              functionality are owned by SoulBond AI and are protected by international copyright, 
              trademark, and other intellectual property laws.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">8. AI Companion Disclaimer</h2>
            <p className="text-gray-300 mb-4">
              Important: SoulBond AI provides AI companions for entertainment and emotional support 
              purposes only. Our Service:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Is NOT a substitute for professional mental health care</li>
              <li>Should NOT be used for medical, legal, or professional advice</li>
              <li>Cannot replace human relationships or therapy</li>
              <li>May occasionally generate incorrect or inappropriate responses</li>
            </ul>
            <p className="text-gray-300 mt-4">
              If you are experiencing a mental health crisis, please contact emergency services 
              or a mental health professional immediately.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-300">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOULBOND AI SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF 
              PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, 
              USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <p className="text-gray-300">
              You agree to indemnify and hold harmless SoulBond AI, its affiliates, and their 
              respective officers, directors, employees, and agents from any claims, liabilities, 
              damages, losses, and expenses arising from your use of the Service or violation of 
              these Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">11. Service Modifications</h2>
            <p className="text-gray-300">
              We reserve the right to modify, suspend, or discontinue the Service at any time 
              without prior notice. We are not liable to you or any third party for any 
              modification, suspension, or discontinuation of the Service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p className="text-gray-300">
              We may terminate or suspend your account immediately, without prior notice or 
              liability, for any reason, including breach of these Terms. Upon termination, 
              your right to use the Service will immediately cease.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-gray-300">
              These Terms shall be governed by and construed in accordance with the laws of 
              [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes 
              shall be resolved in the courts of [Your Jurisdiction].
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
            <p className="text-gray-300">
              We reserve the right to modify these Terms at any time. We will provide notice of 
              material changes through the Service or via email. Your continued use of the Service 
              after changes constitute acceptance of the modified Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <p className="text-gray-300">
              For questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-300 mt-4">
              Email: legal@soulbondai.com<br />
              Address: SoulBond AI, Legal Department<br />
              [Your Business Address]
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              By using SoulBond AI, you acknowledge that you have read, understood, and agree 
              to be bound by these Terms of Service.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}