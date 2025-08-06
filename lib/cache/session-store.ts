import { sessionCache } from './redis-cache'

interface SessionData {
  userId: string
  characterId?: string
  conversationId?: string
  lastActivity: string
  metadata?: any
}

export class SessionStore {
  private static readonly SESSION_TTL = 1800 // 30 minutes

  static async get(sessionId: string): Promise<SessionData | null> {
    return await sessionCache.get<SessionData>(sessionId)
  }

  static async set(sessionId: string, data: SessionData): Promise<void> {
    await sessionCache.set(sessionId, {
      ...data,
      lastActivity: new Date().toISOString()
    }, this.SESSION_TTL)
  }

  static async update(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    const current = await this.get(sessionId)
    if (current) {
      await this.set(sessionId, {
        ...current,
        ...updates,
        lastActivity: new Date().toISOString()
      })
    }
  }

  static async delete(sessionId: string): Promise<void> {
    await sessionCache.delete(sessionId)
  }

  static async exists(sessionId: string): Promise<boolean> {
    return await sessionCache.exists(sessionId)
  }

  static async touch(sessionId: string): Promise<void> {
    const session = await this.get(sessionId)
    if (session) {
      await this.set(sessionId, session) // This will refresh the TTL
    }
  }

  // Get all active sessions for a user
  static async getUserSessions(userId: string): Promise<string[]> {
    // In a real implementation, you'd maintain a set of session IDs per user
    // For now, this is a placeholder
    return []
  }

  // Clear all sessions for a user (e.g., on logout all devices)
  static async clearUserSessions(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId)
    await Promise.all(sessions.map(sessionId => this.delete(sessionId)))
  }
}