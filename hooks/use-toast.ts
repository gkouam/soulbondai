import { useState, useEffect } from 'react'
import { toast as sonnerToast } from 'sonner'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

// Export toast function directly for convenience
export const toast = ({ title, description, variant }: ToastProps) => {
  if (variant === 'destructive') {
    sonnerToast.error(title, {
      description,
    })
  } else {
    sonnerToast.success(title, {
      description,
    })
  }
}

export function useToast() {
  return { toast }
}