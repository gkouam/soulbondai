export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Icon skeleton */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gray-800 rounded-full animate-pulse" />
        </div>
        
        {/* Title skeleton */}
        <div className="text-center space-y-4">
          <div className="h-8 bg-gray-800 rounded-lg max-w-sm mx-auto animate-pulse" />
          <div className="h-6 bg-gray-800 rounded-lg max-w-xl mx-auto animate-pulse" />
        </div>
        
        {/* Traits skeleton */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
          <div className="h-6 bg-gray-800 rounded-lg w-32 mb-4 animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 w-24 bg-gray-800 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Button skeleton */}
        <div className="text-center">
          <div className="h-12 w-48 bg-gray-800 rounded-xl mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  )
}