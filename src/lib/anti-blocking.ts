import { AntiBlockingConfig } from '@/types/linkedin'

/**
 * Anti-blocking system for LinkedIn scraping
 * Implements various techniques to avoid detection and rate limiting
 */
export class AntiBlockingSystem {
  private config: AntiBlockingConfig
  private currentUserAgentIndex = 0
  private currentViewportIndex = 0
  private requestCount = 0
  private sessionStartTime = Date.now()

  constructor(config?: Partial<AntiBlockingConfig>) {
    this.config = {
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0'
      ],
      viewportSizes: [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
        { width: 1536, height: 864 },
        { width: 1280, height: 720 }
      ],
      scrollPatterns: ['smooth', 'instant', 'auto'],
      mouseMovements: true,
      randomDelays: {
        min: 1000,
        max: 3000
      },
      sessionRotation: true,
      cookieManagement: true,
      ...config
    }
  }

  /**
   * Get next user agent in rotation
   */
  getNextUserAgent(): string {
    const userAgent = this.config.userAgents[this.currentUserAgentIndex]
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.config.userAgents.length
    return userAgent
  }

  /**
   * Get next viewport size in rotation
   */
  getNextViewportSize(): { width: number; height: number } {
    const viewport = this.config.viewportSizes[this.currentViewportIndex]
    this.currentViewportIndex = (this.currentViewportIndex + 1) % this.config.viewportSizes.length
    return viewport
  }

  /**
   * Generate random delay between actions
   */
  getRandomDelay(): number {
    const { min, max } = this.config.randomDelays
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Get human-like scroll behavior
   */
  getScrollPattern(): string {
    const patterns = this.config.scrollPatterns
    return patterns[Math.floor(Math.random() * patterns.length)]
  }

  /**
   * Generate random mouse movements
   */
  generateMouseMovements(): Array<{ x: number; y: number; delay: number }> {
    if (!this.config.mouseMovements) return []

    const movements = []
    const numMovements = Math.floor(Math.random() * 3) + 2 // 2-4 movements

    for (let i = 0; i < numMovements; i++) {
      movements.push({
        x: Math.floor(Math.random() * 800) + 100,
        y: Math.floor(Math.random() * 600) + 100,
        delay: Math.floor(Math.random() * 500) + 200
      })
    }

    return movements
  }

  /**
   * Check if session should be rotated
   */
  shouldRotateSession(): boolean {
    if (!this.config.sessionRotation) return false

    const sessionDuration = Date.now() - this.sessionStartTime
    const maxSessionDuration = 30 * 60 * 1000 // 30 minutes
    const maxRequestsPerSession = 100

    return sessionDuration > maxSessionDuration || this.requestCount > maxRequestsPerSession
  }

  /**
   * Reset session counters
   */
  resetSession(): void {
    this.sessionStartTime = Date.now()
    this.requestCount = 0
  }

  /**
   * Increment request counter
   */
  incrementRequestCount(): void {
    this.requestCount++
  }

  /**
   * Get adaptive delay based on request frequency
   */
  getAdaptiveDelay(): number {
    const baseDelay = this.getRandomDelay()
    
    // Increase delay if making too many requests
    if (this.requestCount > 50) {
      return baseDelay * 2
    } else if (this.requestCount > 20) {
      return baseDelay * 1.5
    }
    
    return baseDelay
  }

  /**
   * Generate realistic typing delays for form inputs
   */
  getTypingDelays(text: string): number[] {
    const delays = []
    
    for (let i = 0; i < text.length; i++) {
      // Vary typing speed based on character
      let delay = Math.floor(Math.random() * 100) + 50 // 50-150ms base
      
      // Longer delays for spaces and punctuation
      if (text[i] === ' ') {
        delay += Math.floor(Math.random() * 100) + 100
      } else if (/[.,!?;:]/.test(text[i])) {
        delay += Math.floor(Math.random() * 150) + 50
      }
      
      delays.push(delay)
    }
    
    return delays
  }

  /**
   * Get random scroll amount for pagination
   */
  getRandomScrollAmount(): number {
    // Random scroll between 300-800 pixels
    return Math.floor(Math.random() * 500) + 300
  }

  /**
   * Generate realistic page interaction pattern
   */
  getPageInteractionPattern(): Array<{
    action: 'scroll' | 'hover' | 'click' | 'wait'
    target?: string
    duration: number
  }> {
    const patterns = [
      { action: 'wait' as const, duration: this.getRandomDelay() },
      { action: 'scroll' as const, duration: 1000 },
      { action: 'wait' as const, duration: this.getRandomDelay() },
      { action: 'hover' as const, target: '.job-card', duration: 500 },
      { action: 'wait' as const, duration: this.getRandomDelay() }
    ]
    
    return patterns
  }

  /**
   * Check if rate limit is likely hit
   */
  isRateLimited(responseTime: number, statusCode?: number): boolean {
    // Check for common rate limiting indicators
    if (statusCode === 429) return true
    if (statusCode === 503) return true
    if (responseTime > 10000) return true // Very slow response
    
    return false
  }

  /**
   * Get backoff delay for rate limiting
   */
  getBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s, 8s...
    const jitter = Math.random() * 1000 // Add up to 1s random jitter
    
    return Math.min(baseDelay + jitter, 60000) // Max 60 seconds
  }

  /**
   * Generate browser fingerprint randomization
   */
  getBrowserFingerprint(): {
    userAgent: string
    viewport: { width: number; height: number }
    timezone: string
    language: string
    platform: string
  } {
    const userAgent = this.getNextUserAgent()
    const viewport = this.getNextViewportSize()
    
    const timezones = [
      'Asia/Jakarta',
      'Asia/Singapore',
      'Asia/Kuala_Lumpur',
      'Asia/Bangkok',
      'Asia/Manila'
    ]
    
    const languages = ['en-US', 'en-GB', 'id-ID']
    const platforms = ['Win32', 'MacIntel', 'Linux x86_64']
    
    return {
      userAgent,
      viewport,
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      language: languages[Math.floor(Math.random() * languages.length)],
      platform: platforms[Math.floor(Math.random() * platforms.length)]
    }
  }

  /**
   * Get stealth mode configuration
   */
  getStealthConfig(): Record<string, any> {
    return {
      // Disable automation indicators
      'navigator.webdriver': false,
      'window.chrome': true,
      'navigator.plugins.length': Math.floor(Math.random() * 5) + 3,
      'navigator.languages': ['en-US', 'en', 'id'],
      'screen.colorDepth': 24,
      'screen.pixelDepth': 24,
      
      // Randomize WebGL and Canvas fingerprints
      'webgl.vendor': 'Google Inc.',
      'webgl.renderer': 'ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8681)',
      
      // Disable common detection methods
      'permissions.query': undefined,
      'navigator.permissions.query': undefined
    }
  }

  /**
   * Log anti-blocking metrics
   */
  getMetrics(): {
    requestCount: number
    sessionDuration: number
    userAgentRotations: number
    viewportRotations: number
  } {
    return {
      requestCount: this.requestCount,
      sessionDuration: Date.now() - this.sessionStartTime,
      userAgentRotations: this.currentUserAgentIndex,
      viewportRotations: this.currentViewportIndex
    }
  }
}
