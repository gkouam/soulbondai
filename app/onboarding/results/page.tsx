export default function ResultsPage() {
  // Temporarily return a static page to bypass all React errors
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-500/20 rounded-full mb-4">
          <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Results Page Under Maintenance</h2>
        <p className="text-gray-400">
          We're updating this page to give you a better experience. Please try one of the options below:
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="/onboarding/personality-test"
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Take the Test
          </a>
          <a
            href="/"
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go Home
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          The page will be back online shortly.
        </p>
      </div>
    </div>
  )
}