import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - SoulBond AI",
  description: "Learn how SoulBond AI protects your privacy and handles your personal data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: January 2025</p>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Account information (email, password)</li>
              <li>Profile information (personality assessment results)</li>
              <li>Conversation data with your AI companion</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Usage data and analytics</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Provide and personalize your AI companion experience</li>
              <li>Process your payments and manage subscriptions</li>
              <li>Send you service updates and notifications</li>
              <li>Improve our services through analytics</li>
              <li>Provide customer support</li>
              <li>Ensure safety and prevent abuse</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
            <p className="text-gray-300 mb-4">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure HTTPS connections</li>
              <li>Regular security audits</li>
              <li>Limited access to personal data</li>
              <li>Secure data storage with encryption at rest</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
            <p className="text-gray-300 mb-4">
              We do not sell, trade, or rent your personal information. We may share your information only:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>With service providers who assist our operations (under strict confidentiality)</li>
              <li>To protect rights, privacy, safety, or property</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p className="text-gray-300 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-gray-300">
              We retain your personal information for as long as necessary to provide our services 
              and comply with legal obligations. You can request deletion of your account and 
              associated data at any time through your account settings.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
            <p className="text-gray-300">
              SoulBond AI is not intended for users under 18 years of age. We do not knowingly 
              collect personal information from children under 18.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-300">
              We use cookies and similar technologies to enhance your experience, analyze usage, 
              and provide personalized content. You can manage cookie preferences through your 
              browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="text-gray-300">
              Your information may be transferred to and processed in countries other than your 
              own. We ensure appropriate safeguards are in place to protect your data in accordance 
              with this privacy policy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-300">
              We may update this privacy policy from time to time. We will notify you of any 
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-gray-300">
              If you have questions about this privacy policy or our practices, please contact us at:
            </p>
            <p className="text-gray-300 mt-4">
              Email: privacy@soulbondai.com<br />
              Address: SoulBond AI, Privacy Department<br />
              [Your Business Address]
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              By using SoulBond AI, you agree to the collection and use of information in 
              accordance with this privacy policy.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}