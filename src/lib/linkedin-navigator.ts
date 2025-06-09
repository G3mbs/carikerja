import { LinkedInNavigationState, LinkedInJobElement, LinkedInScrapingError } from '@/types/linkedin'
import { AntiBlockingSystem } from './anti-blocking'

/**
 * LinkedIn navigation and pagination handler
 */
export class LinkedInNavigator {
  private antiBlocking: AntiBlockingSystem
  private navigationState: LinkedInNavigationState
  private page: any // Browser page instance
  private maxRetries = 3

  constructor(page: any, antiBlocking: AntiBlockingSystem) {
    this.page = page
    this.antiBlocking = antiBlocking
    this.navigationState = {
      currentUrl: '',
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      searchFiltersApplied: false,
      lastJobProcessed: 0
    }
  }

  /**
   * Navigate to LinkedIn jobs search page
   */
  async navigateToJobsSearch(searchUrl: string): Promise<void> {
    try {
      console.log('Navigating to LinkedIn jobs search:', searchUrl)
      
      // Apply anti-blocking measures
      const fingerprint = this.antiBlocking.getBrowserFingerprint()
      await this.page.setUserAgent(fingerprint.userAgent)
      await this.page.setViewport(fingerprint.viewport)
      
      // Navigate with realistic timing
      await this.page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      })
      
      this.navigationState.currentUrl = searchUrl
      
      // Wait for page to load and add human-like delay
      await this.humanDelay()
      
      // Check if we're on the correct page
      await this.verifyJobsPage()
      
    } catch (error) {
      throw new LinkedInScrapingError({
        type: 'navigation',
        message: `Failed to navigate to jobs search: ${error.message}`,
        timestamp: new Date().toISOString(),
        retryable: true,
        context: { searchUrl }
      })
    }
  }

  /**
   * Verify we're on LinkedIn jobs page
   */
  private async verifyJobsPage(): Promise<void> {
    const isJobsPage = await this.page.evaluate(() => {
      return window.location.href.includes('linkedin.com/jobs') ||
             document.querySelector('.jobs-search-results') !== null ||
             document.querySelector('[data-test-id="jobs-search-results"]') !== null
    })
    
    if (!isJobsPage) {
      throw new Error('Not on LinkedIn jobs page')
    }
  }

  /**
   * Get total number of pages available
   */
  async getTotalPages(): Promise<number> {
    try {
      // Wait for pagination to load
      await this.page.waitForSelector('.artdeco-pagination', { timeout: 10000 })
      
      const totalPages = await this.page.evaluate(() => {
        // Try different pagination selectors
        const paginationSelectors = [
          '.artdeco-pagination__pages li:last-child button',
          '.artdeco-pagination__page-state',
          '[data-test-pagination-page-btn]:last-child'
        ]
        
        for (const selector of paginationSelectors) {
          const element = document.querySelector(selector)
          if (element) {
            const text = element.textContent?.trim()
            const pageNumber = parseInt(text || '1')
            if (!isNaN(pageNumber)) {
              return pageNumber
            }
          }
        }
        
        // Fallback: count pagination buttons
        const pageButtons = document.querySelectorAll('[data-test-pagination-page-btn]')
        return pageButtons.length || 1
      })
      
      this.navigationState.totalPages = totalPages
      console.log(`Found ${totalPages} total pages`)
      
      return totalPages
      
    } catch (error) {
      console.warn('Could not determine total pages, defaulting to 1:', error.message)
      this.navigationState.totalPages = 1
      return 1
    }
  }

  /**
   * Navigate to specific page
   */
  async navigateToPage(pageNumber: number): Promise<void> {
    if (pageNumber === this.navigationState.currentPage) {
      return // Already on this page
    }
    
    try {
      console.log(`Navigating to page ${pageNumber}`)
      
      // Scroll to pagination area
      await this.scrollToPagination()
      
      // Find and click page button
      const pageButton = await this.page.$(`[data-test-pagination-page-btn="${pageNumber}"]`)
      
      if (pageButton) {
        // Human-like click with mouse movement
        await this.humanClick(pageButton)
      } else {
        // Fallback: modify URL directly
        await this.navigateToPageByUrl(pageNumber)
      }
      
      // Wait for new page to load
      await this.page.waitForSelector('.jobs-search-results', { timeout: 15000 })
      await this.humanDelay()
      
      this.navigationState.currentPage = pageNumber
      this.navigationState.lastJobProcessed = 0
      
    } catch (error) {
      throw new LinkedInScrapingError({
        type: 'navigation',
        message: `Failed to navigate to page ${pageNumber}: ${error.message}`,
        timestamp: new Date().toISOString(),
        page: pageNumber,
        retryable: true
      })
    }
  }

  /**
   * Navigate to page by modifying URL
   */
  private async navigateToPageByUrl(pageNumber: number): Promise<void> {
    const currentUrl = new URL(this.navigationState.currentUrl)
    currentUrl.searchParams.set('start', ((pageNumber - 1) * 25).toString())
    
    await this.page.goto(currentUrl.toString(), { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })
  }

  /**
   * Check if there's a next page
   */
  async hasNextPage(): Promise<boolean> {
    try {
      const hasNext = await this.page.evaluate(() => {
        // Check for next button
        const nextButton = document.querySelector('[aria-label="Next"]')
        return nextButton && !nextButton.hasAttribute('disabled')
      })
      
      this.navigationState.hasNextPage = hasNext
      return hasNext
      
    } catch (error) {
      console.warn('Error checking for next page:', error.message)
      return false
    }
  }

  /**
   * Navigate to next page
   */
  async navigateToNextPage(): Promise<boolean> {
    if (!await this.hasNextPage()) {
      return false
    }
    
    try {
      await this.navigateToPage(this.navigationState.currentPage + 1)
      return true
    } catch (error) {
      console.error('Failed to navigate to next page:', error.message)
      return false
    }
  }

  /**
   * Get all job cards on current page
   */
  async getJobCardsOnPage(): Promise<LinkedInJobElement[]> {
    try {
      // Wait for job cards to load
      await this.page.waitForSelector('.job-search-card', { timeout: 10000 })
      
      const jobElements = await this.page.evaluate(() => {
        const jobCards = document.querySelectorAll('.job-search-card, .jobs-search-results__list-item')
        const jobs: any[] = []
        
        jobCards.forEach((card, index) => {
          try {
            // Extract job information
            const titleElement = card.querySelector('.job-search-card__title a, .job-card-list__title a')
            const companyElement = card.querySelector('.job-search-card__subtitle a, .job-card-container__company-name')
            const locationElement = card.querySelector('.job-search-card__location, .job-card-container__metadata-item')
            const timeElement = card.querySelector('.job-search-card__listdate, .job-card-list__date')
            const easyApplyElement = card.querySelector('.job-search-card__easy-apply-button, [data-easy-apply-button]')
            const promotedElement = card.querySelector('.job-search-card__promoted, .job-card-container__promoted')
            
            if (titleElement && companyElement) {
              jobs.push({
                index,
                jobTitle: titleElement.textContent?.trim() || '',
                companyName: companyElement.textContent?.trim() || '',
                location: locationElement?.textContent?.trim() || '',
                postedTime: timeElement?.textContent?.trim() || '',
                jobUrl: titleElement.href || '',
                isEasyApply: !!easyApplyElement,
                isPromoted: !!promotedElement
              })
            }
          } catch (error) {
            console.warn(`Error extracting job ${index}:`, error.message)
          }
        })
        
        return jobs
      })
      
      console.log(`Found ${jobElements.length} job cards on page ${this.navigationState.currentPage}`)
      return jobElements
      
    } catch (error) {
      throw new LinkedInScrapingError({
        type: 'extraction',
        message: `Failed to get job cards: ${error.message}`,
        timestamp: new Date().toISOString(),
        page: this.navigationState.currentPage,
        retryable: true
      })
    }
  }

  /**
   * Scroll to pagination area
   */
  private async scrollToPagination(): Promise<void> {
    await this.page.evaluate(() => {
      const pagination = document.querySelector('.artdeco-pagination')
      if (pagination) {
        pagination.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
    
    await this.humanDelay(1000)
  }

  /**
   * Human-like click with mouse movement
   */
  private async humanClick(element: any): Promise<void> {
    // Get element position
    const box = await element.boundingBox()
    if (!box) return
    
    // Generate mouse movements
    const movements = this.antiBlocking.generateMouseMovements()
    
    for (const movement of movements) {
      await this.page.mouse.move(movement.x, movement.y)
      await this.humanDelay(movement.delay)
    }
    
    // Move to element and click
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    
    await this.page.mouse.move(x, y)
    await this.humanDelay(200)
    await this.page.mouse.click(x, y)
  }

  /**
   * Human-like delay
   */
  private async humanDelay(baseDelay?: number): Promise<void> {
    const delay = baseDelay || this.antiBlocking.getAdaptiveDelay()
    await this.page.waitForTimeout(delay)
  }

  /**
   * Scroll page naturally
   */
  async scrollPage(): Promise<void> {
    const scrollAmount = this.antiBlocking.getRandomScrollAmount()
    
    await this.page.evaluate((amount) => {
      window.scrollBy({
        top: amount,
        behavior: 'smooth'
      })
    }, scrollAmount)
    
    await this.humanDelay(1000)
  }

  /**
   * Get current navigation state
   */
  getNavigationState(): LinkedInNavigationState {
    return { ...this.navigationState }
  }

  /**
   * Reset navigation state
   */
  resetNavigationState(): void {
    this.navigationState = {
      currentUrl: '',
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      searchFiltersApplied: false,
      lastJobProcessed: 0
    }
  }
}
