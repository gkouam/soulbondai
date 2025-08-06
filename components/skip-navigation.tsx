"use client"

export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-violet-300"
    >
      Skip to main content
    </a>
  )
}