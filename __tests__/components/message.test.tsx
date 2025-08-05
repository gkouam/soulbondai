import { render, screen } from '@testing-library/react'
import { Message } from '@/components/message'

describe('Message Component', () => {
  const mockMessage = {
    id: '1',
    role: 'assistant' as const,
    content: 'Hello! How are you today?',
    createdAt: new Date('2024-01-01T12:00:00Z'),
  }

  it('renders message content correctly', () => {
    render(<Message message={mockMessage} />)
    
    expect(screen.getByText('Hello! How are you today?')).toBeInTheDocument()
  })

  it('displays assistant avatar for assistant messages', () => {
    render(<Message message={mockMessage} />)
    
    const avatar = screen.getByText('AI')
    expect(avatar).toBeInTheDocument()
    expect(avatar.closest('div')).toHaveClass('bg-gradient-to-br')
  })

  it('displays user avatar for user messages', () => {
    const userMessage = { ...mockMessage, role: 'user' as const }
    render(<Message message={userMessage} />)
    
    const avatar = screen.getByText('You')
    expect(avatar).toBeInTheDocument()
  })

  it('formats timestamp correctly', () => {
    render(<Message message={mockMessage} />)
    
    // The component uses date-fns format, so we check for the formatted time
    expect(screen.getByText(/12:00 PM/)).toBeInTheDocument()
  })

  it('applies correct styling for assistant messages', () => {
    const { container } = render(<Message message={mockMessage} />)
    
    const messageContainer = container.firstChild
    expect(messageContainer).toHaveClass('flex', 'gap-3', 'mb-4')
  })

  it('applies correct styling for user messages', () => {
    const userMessage = { ...mockMessage, role: 'user' as const }
    const { container } = render(<Message message={userMessage} />)
    
    const messageContainer = container.firstChild
    expect(messageContainer).toHaveClass('flex-row-reverse')
  })
})