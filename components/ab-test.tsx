import { ReactNode } from 'react'
import { getExperimentVariant } from '@/lib/ab-testing'

interface ABTestProps {
  experimentId: string
  children: Record<string, ReactNode>
  fallback?: ReactNode
}

export async function ABTest({ experimentId, children, fallback }: ABTestProps) {
  const variant = await getExperimentVariant(experimentId)
  
  if (!variant || !children[variant]) {
    return <>{fallback || children.control || null}</>
  }
  
  return <>{children[variant]}</>
}

// Client-side A/B test component
export function ABTestClient({ experimentId, children, fallback }: ABTestProps) {
  if (typeof window === 'undefined') {
    return <>{fallback || null}</>
  }
  
  // Get variant from cookie
  const cookies = document.cookie.split(';')
  const variantCookie = cookies.find(c => c.trim().startsWith(`ab-${experimentId}=`))
  const variant = variantCookie ? variantCookie.split('=')[1] : null
  
  if (!variant || !children[variant]) {
    return <>{fallback || children.control || null}</>
  }
  
  return <>{children[variant]}</>
}