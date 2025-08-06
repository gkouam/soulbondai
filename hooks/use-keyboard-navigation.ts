import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  action: () => void
  description: string
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcut[] = []) {
  const router = useRouter()
  
  // Default global shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      ctrl: true,
      action: () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
      description: 'Focus search'
    },
    {
      key: 'h',
      alt: true,
      action: () => router.push('/'),
      description: 'Go to home'
    },
    {
      key: 'd',
      alt: true,
      action: () => router.push('/dashboard'),
      description: 'Go to dashboard'
    },
    {
      key: 'c',
      alt: true,
      action: () => router.push('/dashboard/chat'),
      description: 'Go to chat'
    },
    {
      key: 's',
      alt: true,
      action: () => router.push('/dashboard/settings'),
      description: 'Go to settings'
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or menus
        const closeButton = document.querySelector('[aria-label*="Close"], [aria-label*="close"]') as HTMLButtonElement
        if (closeButton) {
          closeButton.click()
        }
      },
      description: 'Close modal/menu'
    }
  ]
  
  const allShortcuts = [...defaultShortcuts, ...shortcuts]
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    const isContentEditable = target.contentEditable === 'true'
    
    if (isInput || isContentEditable) {
      // Allow Escape key even in inputs
      if (event.key !== 'Escape') {
        return
      }
    }
    
    // Check each shortcut
    for (const shortcut of allShortcuts) {
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const matchesCtrl = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true
      const matchesAlt = shortcut.alt ? event.altKey : true
      const matchesShift = shortcut.shift ? event.shiftKey : true
      
      if (matchesKey && matchesCtrl && matchesAlt && matchesShift) {
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [allShortcuts])
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
  
  return { shortcuts: allShortcuts }
}

// Hook for managing focus within a container
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return
    
    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement
    
    // Focus first element when trap is activated
    if (firstFocusable) {
      firstFocusable.focus()
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }
    
    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [containerRef, isActive])
}

// Hook for arrow key navigation in lists
export function useArrowKeyNavigation(
  items: HTMLElement[],
  options: {
    loop?: boolean
    orientation?: 'horizontal' | 'vertical' | 'both'
    onSelect?: (index: number) => void
  } = {}
) {
  const { loop = true, orientation = 'vertical', onSelect } = options
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = items.findIndex(item => item === document.activeElement)
      if (currentIndex === -1) return
      
      let nextIndex = currentIndex
      
      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault()
            nextIndex = currentIndex + 1
          }
          break
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault()
            nextIndex = currentIndex - 1
          }
          break
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault()
            nextIndex = currentIndex + 1
          }
          break
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault()
            nextIndex = currentIndex - 1
          }
          break
        case 'Home':
          e.preventDefault()
          nextIndex = 0
          break
        case 'End':
          e.preventDefault()
          nextIndex = items.length - 1
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (onSelect) {
            onSelect(currentIndex)
          }
          break
        default:
          return
      }
      
      // Handle looping
      if (loop) {
        if (nextIndex < 0) nextIndex = items.length - 1
        if (nextIndex >= items.length) nextIndex = 0
      } else {
        nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex))
      }
      
      // Focus next item
      if (nextIndex !== currentIndex && items[nextIndex]) {
        items[nextIndex].focus()
      }
    }
    
    items.forEach(item => {
      item.addEventListener('keydown', handleKeyDown)
    })
    
    return () => {
      items.forEach(item => {
        item.removeEventListener('keydown', handleKeyDown)
      })
    }
  }, [items, loop, orientation, onSelect])
}