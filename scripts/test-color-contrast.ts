import { getWCAGCompliance } from '@/lib/accessibility/color-contrast'

// Test common color combinations in the app
const colorTests = [
  // Dark mode text on backgrounds
  { name: 'Primary text on dark bg', fg: '#fafafa', bg: '#171717' },
  { name: 'Muted text on dark bg', fg: '#a3a3a3', bg: '#171717' },
  { name: 'Improved muted text', fg: '#cccccc', bg: '#171717' },
  
  // Buttons
  { name: 'White text on purple button', fg: '#ffffff', bg: '#8b5cf6' },
  { name: 'White text on pink button', fg: '#ffffff', bg: '#ec4899' },
  
  // Status colors
  { name: 'Success text on dark', fg: '#4ade80', bg: '#171717' },
  { name: 'Warning text on dark', fg: '#fbbf24', bg: '#171717' },
  { name: 'Error text on dark', fg: '#f87171', bg: '#171717' },
  { name: 'Info text on dark', fg: '#60a5fa', bg: '#171717' },
  
  // Improved status colors
  { name: 'Better success text', fg: '#86efac', bg: '#171717' },
  { name: 'Better warning text', fg: '#fde047', bg: '#171717' },
  { name: 'Better error text', fg: '#fca5a5', bg: '#171717' },
  { name: 'Better info text', fg: '#93c5fd', bg: '#171717' },
]

console.log('=== WCAG Color Contrast Test Results ===\n')

colorTests.forEach(({ name, fg, bg }) => {
  const result = getWCAGCompliance(fg, bg)
  const status = result.AA ? '✅' : '❌'
  const level = result.AAA ? 'AAA' : result.AA ? 'AA' : 'FAIL'
  
  console.log(`${status} ${name}`)
  console.log(`   Foreground: ${fg}, Background: ${bg}`)
  console.log(`   Ratio: ${result.ratio.toFixed(2)}:1 (${level})`)
  console.log(`   ${result.recommendation}\n`)
})

// Test large text scenarios
console.log('\n=== Large Text Tests (18pt+) ===\n')

const largeTextTests = [
  { name: 'Heading with muted color', fg: '#a3a3a3', bg: '#171717' },
  { name: 'Heading with improved color', fg: '#cccccc', bg: '#171717' },
]

largeTextTests.forEach(({ name, fg, bg }) => {
  const result = getWCAGCompliance(fg, bg, true)
  const status = result.AA ? '✅' : '❌'
  const level = result.AAA ? 'AAA' : result.AA ? 'AA' : 'FAIL'
  
  console.log(`${status} ${name} (Large Text)`)
  console.log(`   Foreground: ${fg}, Background: ${bg}`)
  console.log(`   Ratio: ${result.ratio.toFixed(2)}:1 (${level})`)
  console.log(`   ${result.recommendation}\n`)
})