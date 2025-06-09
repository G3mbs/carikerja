// LinkedIn Scraping Types

export interface LinkedInJobData {
  id: string
  linkedinUrl: string
  companyLogoUrl?: string
  jobTitleShort?: string
  insightStatus?: string
  applicationStatus?: string
  easyApply: boolean
  additionalInsights: string[]
  
  // Standard job fields
  jobTitle: string
  companyName: string
  location: string
  salaryRange?: string
  postedTime: string
  matchScore?: number
  
  // Metadata
  scrapingSessionId: string
  scrapedAt: string
}

export interface LinkedInSearchParams {
  keywords: string[]
  location: string[]
  experienceLevel?: string
  jobType?: string[] // full-time, part-time, contract, etc.
  datePosted?: string // past-24h, past-week, past-month
  salaryRange?: {
    min?: number
    max?: number
  }
  companySize?: string[] // startup, small, medium, large
  industry?: string[]
  remoteWork?: boolean
  easyApply?: boolean
}

export interface ScrapingProgress {
  currentPage: number
  totalPages: number
  jobsFound: number
  jobsProcessed: number
  status: 'initializing' | 'searching' | 'extracting' | 'completed' | 'failed' | 'paused'
  message: string
  startTime: string
  estimatedTimeRemaining?: number
  errors: string[]
}

export interface LinkedInScrapingSession {
  id: string
  userId: string
  cvId: string
  searchParams: LinkedInSearchParams
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  progress: ScrapingProgress
  totalJobsFound: number
  googleSheetsUrl?: string
  errorMessage?: string
  retryCount: number
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface LinkedInScrapingConfig {
  maxPages: number
  maxJobsPerPage: number
  delayBetweenPages: number
  delayBetweenJobs: number
  antiBlockingEnabled: boolean
  userAgentRotation: boolean
  proxyRotation: boolean
  retryAttempts: number
  exportToSheets: boolean
  sheetsTemplate?: string
}

export interface LinkedInScrapingResult {
  success: boolean
  sessionId: string
  jobsFound: LinkedInJobData[]
  totalJobsScraped: number
  googleSheetsUrl?: string
  errors: string[]
  duration: number
}

export interface GoogleSheetsExportConfig {
  spreadsheetName: string
  worksheetName: string
  includeHeaders: boolean
  autoFormat: boolean
  shareWithUser?: string
  templateUrl?: string
}

export interface AntiBlockingConfig {
  userAgents: string[]
  viewportSizes: { width: number; height: number }[]
  scrollPatterns: string[]
  mouseMovements: boolean
  randomDelays: {
    min: number
    max: number
  }
  sessionRotation: boolean
  cookieManagement: boolean
}

export interface CVToLinkedInMapping {
  keywords: string[]
  location: string[]
  experienceLevel: string
  industry: string[]
  salaryExpectation?: {
    min: number
    max: number
  }
  preferredJobTypes: string[]
  remotePreference: boolean
}

// LinkedIn Job Template for Google Sheets
export interface LinkedInJobSheetRow {
  'Company Logo': string
  'Job Title': string
  'Company': string
  'Location': string
  'Salary': string
  'Posted Time': string
  'Application Status': string
  'Easy Apply': string
  'LinkedIn URL': string
  'Match Score': string
  'Scraped Date': string
  'Additional Insights': string
}

// Navigation and Pagination Types
export interface LinkedInNavigationState {
  currentUrl: string
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  searchFiltersApplied: boolean
  lastJobProcessed: number
}

export interface LinkedInJobElement {
  jobCardElement: any // Browser element
  jobTitle: string
  companyName: string
  location: string
  postedTime: string
  jobUrl: string
  isEasyApply: boolean
  isPromoted: boolean
}

// Error Handling Types
export interface LinkedInScrapingErrorData {
  type: 'navigation' | 'extraction' | 'rate_limit' | 'blocked' | 'network' | 'parsing'
  message: string
  timestamp: string
  page?: number
  jobUrl?: string
  retryable: boolean
  context?: any
}

export class LinkedInScrapingError extends Error {
  public type: LinkedInScrapingErrorData['type']
  public timestamp: string
  public page?: number
  public jobUrl?: string
  public retryable: boolean
  public context?: any

  constructor(data: LinkedInScrapingErrorData) {
    super(data.message)
    this.name = 'LinkedInScrapingError'
    this.type = data.type
    this.timestamp = data.timestamp
    this.page = data.page
    this.jobUrl = data.jobUrl
    this.retryable = data.retryable
    this.context = data.context
  }
}

// Real-time Updates Types
export interface ScrapingUpdate {
  sessionId: string
  type: 'progress' | 'job_found' | 'page_completed' | 'error' | 'completed'
  data: any
  timestamp: string
}

// LinkedIn Platform Specific Types
export interface LinkedInJobInsight {
  type: 'promoted' | 'easy_apply' | 'actively_recruiting' | 'recently_posted' | 'high_applicant_volume'
  text: string
  priority: 'high' | 'medium' | 'low'
}

export interface LinkedInCompanyInfo {
  name: string
  logoUrl?: string
  size?: string
  industry?: string
  location?: string
  followersCount?: number
  isVerified: boolean
}
