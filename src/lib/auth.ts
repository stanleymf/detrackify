import { DatabaseService, type User, type UserSession } from './database'

export interface AuthService {
  login(email: string, password: string): Promise<{ success: boolean; sessionToken?: string; error?: string }>
  register(email: string, password: string): Promise<{ success: boolean; sessionToken?: string; error?: string }>
  validateSession(sessionToken: string): Promise<{ valid: boolean; user?: User; error?: string }>
  logout(sessionToken: string): Promise<void>
  hashPassword(password: string): Promise<string>
  verifyPassword(password: string, hash: string): Promise<boolean>
}

export class CloudflareAuthService implements AuthService {
  private db: DatabaseService
  private jwtSecret: string

  constructor(db: DatabaseService, jwtSecret: string) {
    this.db = db
    this.jwtSecret = jwtSecret
  }

  async login(email: string, password: string): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
    try {
      // Get user by email
      const user = await this.db.getUserByEmail(email)
      if (!user) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password_hash)
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Create session
      const sessionToken = await this.createSession(user.id)
      
      return { success: true, sessionToken }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  async register(email: string, password: string): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.db.getUserByEmail(email)
      if (existingUser) {
        return { success: false, error: 'User already exists' }
      }

      // Hash password
      const passwordHash = await this.hashPassword(password)

      // Create user
      const user = await this.db.createUser(email, passwordHash)

      // Create session
      const sessionToken = await this.createSession(user.id)
      
      return { success: true, sessionToken }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  async validateSession(sessionToken: string): Promise<{ valid: boolean; user?: User; error?: string }> {
    try {
      // Get session from database
      const session = await this.db.getSessionByToken(sessionToken)
      if (!session) {
        return { valid: false, error: 'Invalid session' }
      }

      // Check if session is expired
      if (new Date(session.expires_at) <= new Date()) {
        await this.db.deleteSession(sessionToken)
        return { valid: false, error: 'Session expired' }
      }

      // Get user
      const user = await this.db.getUserByEmail(session.user_id)
      if (!user) {
        await this.db.deleteSession(sessionToken)
        return { valid: false, error: 'User not found' }
      }

      return { valid: true, user }
    } catch (error) {
      console.error('Session validation error:', error)
      return { valid: false, error: 'Session validation failed' }
    }
  }

  async logout(sessionToken: string): Promise<void> {
    try {
      await this.db.deleteSession(sessionToken)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  async hashPassword(password: string): Promise<string> {
    // For Cloudflare Workers, we'll use a simple hash
    // In production, you should use a proper password hashing library
    const encoder = new TextEncoder()
    const data = encoder.encode(password + this.jwtSecret)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password)
    return passwordHash === hash
  }

  private async createSession(userId: string): Promise<string> {
    // Generate session token
    const sessionToken = crypto.randomUUID()
    
    // Set expiration (30 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    
    // Create session in database
    await this.db.createSession(userId, sessionToken, expiresAt.toISOString())
    
    return sessionToken
  }
}

// Utility functions for request/response handling
export function getSessionTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie')
  if (!cookie) return null
  
  const sessionMatch = cookie.match(/session=([^;]+)/)
  return sessionMatch ? sessionMatch[1] : null
}

export function setSessionCookie(sessionToken: string): string {
  const expires = new Date()
  expires.setDate(expires.getDate() + 30)
  
  return `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Expires=${expires.toUTCString()}`
}

export function clearSessionCookie(): string {
  return 'session=; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

// Middleware for protecting routes
export async function requireAuth(
  request: Request,
  authService: CloudflareAuthService
): Promise<{ authenticated: boolean; user?: User; error?: string }> {
  const sessionToken = getSessionTokenFromRequest(request)
  if (!sessionToken) {
    return { authenticated: false, error: 'No session token' }
  }

  const { valid, user, error } = await authService.validateSession(sessionToken)
  if (!valid) {
    return { authenticated: false, error }
  }

  return { authenticated: true, user }
} 