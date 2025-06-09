import { 
  LinkedInSearchParams, 
  LinkedInJobData, 
  LinkedInScrapingSession,
  LinkedInScrapingConfig,
  LinkedInScrapingResult,
  ScrapingProgress,
  LinkedInScrapingError
} from '@/types/linkedin'
import { CVToLinkedInConverter } from './cv-to-linkedin-params'
import { AntiBlockingSystem } from './anti-blocking'
import { LinkedInNavigator } from './linkedin-navigator'
import { GoogleSheetsEnhanced } from './google-sheets-enhanced'
import { supabaseAdmin } from './supabase'

/**
 * Main LinkedIn scraper class
 */
export class LinkedInScraper {
  private config: LinkedInScrapingConfig
  private antiBlocking: AntiBlockingSystem
  private googleSheets: GoogleSheetsEnhanced
  private page: any
  private navigator: LinkedInNavigator | null = null
  private currentSession: LinkedInScrapingSession | null = null

  constructor(config?: Partial<LinkedInScrapingConfig>) {
    this.config = {
      maxPages: 10,
      maxJobsPerPage: 25,
      delayBetweenPages: 3000,
      delayBetweenJobs: 1000,
      antiBlockingEnabled: true,
      userAgentRotation: true,
      proxyRotation: false,
      retryAttempts: 3,
      exportToSheets: true,
      ...config
    }

    this.antiBlocking = new AntiBlockingSystem()
    this.googleSheets = new GoogleSheetsEnhanced()
  }

  /**
   * Start LinkedIn job scraping
   */
  async scrapeJobs(
    searchParams: LinkedInSearchParams,
    userId: string,
    cvId?: string
  ): Promise<LinkedInScrapingResult> {
    const startTime = Date.now()
    let sessionId: string | null = null

    try {
      // Validate parameters
      const validation = CVToLinkedInConverter.validateLinkedInParams(searchParams)
      if (!validation.valid) {
        throw new Error(`Invalid search parameters: ${validation.errors.join(', ')}`)
      }

      // Create scraping session
      sessionId = await this.createScrapingSession(searchParams, userId, cvId)
      
      // Initialize browser
      await this.initializeBrowser()
      
      // Generate search URL
      const searchUrl = CVToLinkedInConverter.generateLinkedInSearchUrl(searchParams)
      console.log('Starting LinkedIn scraping with URL:', searchUrl)
      
      // Navigate to LinkedIn jobs
      await this.navigator!.navigateToJobsSearch(searchUrl)
      
      // Get total pages
      const totalPages = Math.min(
        await this.navigator!.getTotalPages(),
        this.config.maxPages
      )
      
      // Update session with total pages
      await this.updateSessionProgress(sessionId, {
        currentPage: 1,
        totalPages,
        jobsFound: 0,
        jobsProcessed: 0,
        status: 'searching',
        message: `Found ${totalPages} pages to scrape`,
        startTime: new Date().toISOString(),
        errors: []
      })

      // Scrape all pages
      const allJobs: LinkedInJobData[] = []
      
      for (let page = 1; page <= totalPages; page++) {
        try {
          console.log(`Scraping page ${page} of ${totalPages}`)
          
          // Navigate to page if not first page
          if (page > 1) {
            await this.navigator!.navigateToPage(page)
          }
          
          // Scrape jobs on current page
          const pageJobs = await this.scrapeJobsOnPage(sessionId, page)
          allJobs.push(...pageJobs)
          
          // Update progress
          await this.updateSessionProgress(sessionId, {
            currentPage: page,
            totalPages,
            jobsFound: allJobs.length,
            jobsProcessed: allJobs.length,
            status: 'extracting',
            message: `Scraped ${allJobs.length} jobs from ${page} pages`,
            startTime: new Date().toISOString(),
            errors: []
          })
          
          // Delay between pages
          if (page < totalPages) {
            await this.humanDelay(this.config.delayBetweenPages)
          }
          
        } catch (error) {
          console.error(`Error scraping page ${page}:`, error.message)
          
          // Update session with error but continue
          await this.updateSessionProgress(sessionId, {
            currentPage: page,
            totalPages,
            jobsFound: allJobs.length,
            jobsProcessed: allJobs.length,
            status: 'extracting',
            message: `Error on page ${page}: ${error.message}`,
            startTime: new Date().toISOString(),
            errors: [error.message]
          })
          
          // Continue to next page unless it's a critical error
          if (!this.isCriticalError(error)) {
            continue
          } else {
            break
          }
        }
      }

      // Export to Google Sheets if enabled
      let googleSheetsUrl: string | undefined
      if (this.config.exportToSheets && allJobs.length > 0) {
        try {
          googleSheetsUrl = await this.exportToGoogleSheets(allJobs, userId)
        } catch (error) {
          console.error('Failed to export to Google Sheets:', error.message)
        }
      }

      // Save jobs to database
      await this.saveJobsToDatabase(allJobs, sessionId)

      // Mark session as completed
      await this.completeSession(sessionId, allJobs.length, googleSheetsUrl)

      const duration = Date.now() - startTime
      console.log(`LinkedIn scraping completed: ${allJobs.length} jobs in ${duration}ms`)

      return {
        success: true,
        sessionId,
        jobsFound: allJobs,
        totalJobsScraped: allJobs.length,
        googleSheetsUrl,
        errors: [],
        duration
      }

    } catch (error) {
      console.error('LinkedIn scraping failed:', error)
      
      if (sessionId) {
        await this.failSession(sessionId, error.message)
      }

      return {
        success: false,
        sessionId: sessionId || '',
        jobsFound: [],
        totalJobsScraped: 0,
        errors: [error.message],
        duration: Date.now() - startTime
      }

    } finally {
      // Cleanup browser
      await this.cleanup()
    }
  }

  /**
   * Initialize browser with anti-blocking measures
   */
  private async initializeBrowser(): Promise<void> {
    try {
      // Note: In production, use Browser Use API or Puppeteer
      // This is a placeholder for browser initialization
      console.log('Initializing browser with anti-blocking measures...')
      
      // Apply browser fingerprint
      const fingerprint = this.antiBlocking.getBrowserFingerprint()
      console.log('Applied browser fingerprint:', fingerprint.userAgent)
      
      // Initialize navigator
      this.navigator = new LinkedInNavigator(this.page, this.antiBlocking)
      
    } catch (error) {
      throw new LinkedInScrapingError({
        type: 'navigation',
        message: `Failed to initialize browser: ${error.message}`,
        timestamp: new Date().toISOString(),
        retryable: false
      })
    }
  }

  /**
   * Scrape jobs on current page
   */
  private async scrapeJobsOnPage(sessionId: string, pageNumber: number): Promise<LinkedInJobData[]> {
    try {
      // Get job cards on page
      const jobElements = await this.navigator!.getJobCardsOnPage()
      const jobs: LinkedInJobData[] = []

      for (let i = 0; i < jobElements.length; i++) {
        try {
          const jobElement = jobElements[i]
          
          // Extract detailed job information
          const jobData = await this.extractJobData(jobElement, sessionId)
          
          if (jobData) {
            jobs.push(jobData)
          }
          
          // Delay between jobs
          await this.humanDelay(this.config.delayBetweenJobs)
          
        } catch (error) {
          console.warn(`Error extracting job ${i} on page ${pageNumber}:`, error.message)
          continue
        }
      }

      console.log(`Extracted ${jobs.length} jobs from page ${pageNumber}`)
      return jobs

    } catch (error) {
      throw new LinkedInScrapingError({
        type: 'extraction',
        message: `Failed to scrape jobs on page ${pageNumber}: ${error.message}`,
        timestamp: new Date().toISOString(),
        page: pageNumber,
        retryable: true
      })
    }
  }

  /**
   * Extract detailed job data from job element
   */
  private async extractJobData(jobElement: any, sessionId: string): Promise<LinkedInJobData | null> {
    try {
      // Generate unique job ID
      const jobId = `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Extract additional insights
      const additionalInsights: string[] = []
      if (jobElement.isPromoted) additionalInsights.push('Promoted')
      if (jobElement.isEasyApply) additionalInsights.push('Easy Apply')
      
      const jobData: LinkedInJobData = {
        id: jobId,
        linkedinUrl: jobElement.jobUrl,
        companyLogoUrl: '', // Would be extracted from page
        jobTitleShort: jobElement.jobTitle.substring(0, 50),
        insightStatus: jobElement.isPromoted ? 'promoted' : 'normal',
        applicationStatus: 'not_applied',
        easyApply: jobElement.isEasyApply,
        additionalInsights,
        
        // Standard fields
        jobTitle: jobElement.jobTitle,
        companyName: jobElement.companyName,
        location: jobElement.location,
        salaryRange: '', // Would be extracted if available
        postedTime: jobElement.postedTime,
        matchScore: this.calculateMatchScore(jobElement),
        
        // Metadata
        scrapingSessionId: sessionId,
        scrapedAt: new Date().toISOString()
      }

      return jobData

    } catch (error) {
      console.error('Error extracting job data:', error.message)
      return null
    }
  }

  /**
   * Calculate match score for job
   */
  private calculateMatchScore(jobElement: any): number {
    // Simple scoring algorithm
    let score = 50 // Base score
    
    if (jobElement.isEasyApply) score += 10
    if (jobElement.location.toLowerCase().includes('jakarta')) score += 5
    if (jobElement.postedTime.includes('day')) score += 15 // Recent posting
    
    return Math.min(score, 100)
  }

  /**
   * Human-like delay
   */
  private async humanDelay(baseDelay: number): Promise<void> {
    const delay = baseDelay + (Math.random() * 1000) // Add random jitter
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Check if error is critical
   */
  private isCriticalError(error: any): boolean {
    const criticalMessages = [
      'blocked',
      'rate limit',
      'captcha',
      'login required',
      'access denied'
    ]
    
    return criticalMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    )
  }

  /**
   * Create scraping session in database
   */
  private async createScrapingSession(
    searchParams: LinkedInSearchParams,
    userId: string,
    cvId?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin
        .from('linkedin_scraping_sessions')
        .insert({
          user_id: userId,
          cv_id: cvId,
          search_params: searchParams,
          status: 'pending',
          progress: {
            currentPage: 0,
            totalPages: 0,
            jobsFound: 0,
            jobsProcessed: 0,
            status: 'initializing',
            message: 'Initializing scraping session...',
            startTime: new Date().toISOString(),
            errors: []
          }
        })
        .select()
        .single()

      if (error) throw error

      console.log('Created scraping session:', data.id)
      return data.id

    } catch (error) {
      console.error('Error creating scraping session:', error)
      throw error
    }
  }

  /**
   * Update session progress
   */
  private async updateSessionProgress(sessionId: string, progress: ScrapingProgress): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('linkedin_scraping_sessions')
        .update({
          progress,
          status: 'running',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

    } catch (error) {
      console.error('Error updating session progress:', error)
    }
  }

  /**
   * Save jobs to database
   */
  private async saveJobsToDatabase(jobs: LinkedInJobData[], sessionId: string): Promise<void> {
    try {
      if (jobs.length === 0) return

      const { error } = await supabaseAdmin
        .from('linkedin_jobs')
        .insert(
          jobs.map(job => ({
            user_id: this.currentSession?.userId,
            cv_id: this.currentSession?.cvId,
            linkedin_url: job.linkedinUrl,
            company_logo_url: job.companyLogoUrl,
            job_title_short: job.jobTitleShort,
            insight_status: job.insightStatus,
            application_status: job.applicationStatus,
            easy_apply: job.easyApply,
            additional_insights: job.additionalInsights,
            job_title: job.jobTitle,
            company_name: job.companyName,
            location: job.location,
            salary_range: job.salaryRange,
            posted_time: job.postedTime,
            match_score: job.matchScore,
            scraping_session_id: sessionId,
            scraped_at: job.scrapedAt
          }))
        )

      if (error) throw error

      console.log(`Saved ${jobs.length} jobs to database`)

    } catch (error) {
      console.error('Error saving jobs to database:', error)
      throw error
    }
  }

  /**
   * Export jobs to Google Sheets
   */
  private async exportToGoogleSheets(jobs: LinkedInJobData[], userId: string): Promise<string> {
    try {
      const config = {
        spreadsheetName: `LinkedIn Jobs - ${new Date().toLocaleDateString()}`,
        worksheetName: 'LinkedIn Jobs',
        includeHeaders: true,
        autoFormat: true,
        shareWithUser: undefined // Would get user email from database
      }

      const { url } = await this.googleSheets.createLinkedInJobSpreadsheet(config, userId)
      await this.googleSheets.exportLinkedInJobs(url.split('/d/')[1].split('/')[0], jobs, config)

      console.log('Exported jobs to Google Sheets:', url)
      return url

    } catch (error) {
      console.error('Error exporting to Google Sheets:', error)
      throw error
    }
  }

  /**
   * Complete scraping session
   */
  private async completeSession(
    sessionId: string,
    totalJobs: number,
    googleSheetsUrl?: string
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('linkedin_scraping_sessions')
        .update({
          status: 'completed',
          total_jobs_found: totalJobs,
          google_sheets_url: googleSheetsUrl,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

      console.log(`Completed scraping session ${sessionId} with ${totalJobs} jobs`)

    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  /**
   * Mark session as failed
   */
  private async failSession(sessionId: string, errorMessage: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('linkedin_scraping_sessions')
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

      console.log(`Failed scraping session ${sessionId}: ${errorMessage}`)

    } catch (error) {
      console.error('Error failing session:', error)
    }
  }



  /**
   * Get session status
   */
  async getSessionStatus(sessionId: string): Promise<LinkedInScrapingSession | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('linkedin_scraping_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error

      return data

    } catch (error) {
      console.error('Error getting session status:', error)
      return null
    }
  }

  /**
   * Cleanup browser resources
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.page) {
        // Close browser page
        console.log('Cleaning up browser resources...')
      }
    } catch (error) {
      console.warn('Error during cleanup:', error.message)
    }
  }
}
