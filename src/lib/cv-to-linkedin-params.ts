import { CVAnalysis } from '@/types'
import { LinkedInSearchParams, CVToLinkedInMapping } from '@/types/linkedin'

/**
 * Converts CV analysis data to LinkedIn search parameters
 */
export class CVToLinkedInConverter {
  
  /**
   * Main conversion function
   */
  static convertCVToLinkedInParams(cvAnalysis: CVAnalysis): LinkedInSearchParams {
    if (!cvAnalysis) {
      throw new Error('CV analysis data is required')
    }

    const mapping = this.createMapping(cvAnalysis)
    
    return {
      keywords: mapping.keywords,
      location: mapping.location,
      experienceLevel: mapping.experienceLevel,
      jobType: mapping.preferredJobTypes,
      salaryRange: mapping.salaryExpectation,
      industry: mapping.industry,
      remoteWork: mapping.remotePreference,
      easyApply: true, // Default to easy apply for better automation
      datePosted: 'past-month' // Focus on recent postings
    }
  }

  /**
   * Create detailed mapping from CV analysis
   */
  private static createMapping(cvAnalysis: CVAnalysis): CVToLinkedInMapping {
    return {
      keywords: this.extractKeywords(cvAnalysis),
      location: this.extractLocations(cvAnalysis),
      experienceLevel: this.mapExperienceLevel(cvAnalysis.ringkasan_analisis.tingkat_pengalaman),
      industry: this.extractIndustries(cvAnalysis),
      salaryExpectation: this.extractSalaryExpectation(cvAnalysis),
      preferredJobTypes: this.extractJobTypes(cvAnalysis),
      remotePreference: this.determineRemotePreference(cvAnalysis)
    }
  }

  /**
   * Extract and prioritize keywords from CV
   */
  private static extractKeywords(cvAnalysis: CVAnalysis): string[] {
    const keywords: string[] = []

    // Primary keywords from potential matching positions
    if (cvAnalysis.ringkasan_analisis?.potensi_kecocokan_posisi) {
      keywords.push(...cvAnalysis.ringkasan_analisis.potensi_kecocokan_posisi)
    }

    // Current position from work experience
    if (cvAnalysis.pengalaman_kerja && cvAnalysis.pengalaman_kerja.length > 0) {
      const currentJob = cvAnalysis.pengalaman_kerja.find(job => job.tanggal_selesai === 'Sekarang') || cvAnalysis.pengalaman_kerja[0]
      if (currentJob) {
        keywords.push(currentJob.posisi)
      }
    }

    // Technical skills (top 5)
    if (cvAnalysis.keahlian?.keahlian_teknis) {
      keywords.push(...cvAnalysis.keahlian.keahlian_teknis.slice(0, 5))
    }

    // Programming languages
    if (cvAnalysis.keahlian?.bahasa_pemrograman) {
      keywords.push(...cvAnalysis.keahlian.bahasa_pemrograman.slice(0, 3))
    }

    // Remove duplicates and limit to 10 keywords
    return [...new Set(keywords)].slice(0, 10)
  }

  /**
   * Extract location preferences
   */
  private static extractLocations(cvAnalysis: CVAnalysis): string[] {
    const locations: string[] = []

    // Current location from personal info
    if (cvAnalysis.informasi_pribadi?.lokasi) {
      locations.push(cvAnalysis.informasi_pribadi.lokasi)
    }

    // Default to Jakarta if no location specified
    if (locations.length === 0) {
      locations.push('Jakarta, Indonesia')
    }

    return locations
  }

  /**
   * Map experience level to LinkedIn format
   */
  private static mapExperienceLevel(tingkatPengalaman: string): string {
    const mapping: Record<string, string> = {
      'Fresh Graduate': 'entry',
      'Junior': 'associate',
      'Menengah': 'mid',
      'Senior': 'senior',
      'Ahli': 'senior'
    }

    return mapping[tingkatPengalaman] || 'entry'
  }

  /**
   * Extract industry preferences
   */
  private static extractIndustries(cvAnalysis: CVAnalysis): string[] {
    const industries: string[] = []

    // Extract industries from work experience companies
    if (cvAnalysis.pengalaman_kerja) {
      cvAnalysis.pengalaman_kerja.forEach(job => {
        // Simple industry inference based on company name
        const company = job.perusahaan.toLowerCase()
        if (company.includes('tech') || company.includes('teknologi')) {
          industries.push('Technology')
        } else if (company.includes('startup')) {
          industries.push('Startup')
        } else if (company.includes('bank') || company.includes('finance')) {
          industries.push('Financial Services')
        }
      })
    }

    // Default industries based on technical skills
    if (cvAnalysis.keahlian?.keahlian_teknis) {
      industries.push('Technology', 'Software Development')
    }

    // Remove duplicates
    return [...new Set(industries)]
  }

  /**
   * Extract salary expectation from CV analysis
   */
  private static extractSalaryExpectation(cvAnalysis: CVAnalysis): { min: number; max: number } | undefined {
    const salaryData = cvAnalysis.ringkasan_analisis?.estimasi_gaji_bulanan_rupiah

    if (!salaryData || !salaryData.rentang_bawah || !salaryData.rentang_atas) {
      return undefined
    }

    return {
      min: salaryData.rentang_bawah,
      max: salaryData.rentang_atas
    }
  }

  /**
   * Determine preferred job types
   */
  private static extractJobTypes(cvAnalysis: CVAnalysis): string[] {
    const jobTypes: string[] = ['full-time'] // Default

    // Infer job types from work experience
    if (cvAnalysis.pengalaman_kerja) {
      cvAnalysis.pengalaman_kerja.forEach(job => {
        const company = job.perusahaan.toLowerCase()
        if (company.includes('startup') || company.includes('freelance')) {
          jobTypes.push('contract')
        }
      })
    }

    return [...new Set(jobTypes)] // Remove duplicates
  }

  /**
   * Determine remote work preference
   */
  private static determineRemotePreference(cvAnalysis: CVAnalysis): boolean {
    // Check current location for remote indicators
    const currentLocation = cvAnalysis.informasi_pribadi?.lokasi || ''

    // Check if current location or work experience mentions remote work
    if (currentLocation.toLowerCase().includes('remote')) {
      return true
    }

    // Check work experience for remote work indicators
    if (cvAnalysis.pengalaman_kerja) {
      return cvAnalysis.pengalaman_kerja.some(job =>
        job.lokasi?.toLowerCase().includes('remote') ||
        job.deskripsi_tugas.some((task: string) =>
          task.toLowerCase().includes('remote') ||
          task.toLowerCase().includes('work from home') ||
          task.toLowerCase().includes('wfh')
        )
      )
    }

    return false
  }

  /**
   * Generate LinkedIn search URL from parameters
   */
  static generateLinkedInSearchUrl(params: LinkedInSearchParams): string {
    const baseUrl = 'https://www.linkedin.com/jobs/search/'
    const searchParams = new URLSearchParams()
    
    // Keywords
    if (params.keywords.length > 0) {
      searchParams.set('keywords', params.keywords.join(' '))
    }
    
    // Location
    if (params.location.length > 0) {
      searchParams.set('location', params.location[0]) // LinkedIn takes single location
    }
    
    // Experience level
    if (params.experienceLevel) {
      const experienceMap: Record<string, string> = {
        'entry': '1',
        'associate': '2',
        'mid': '3',
        'senior': '4'
      }
      searchParams.set('f_E', experienceMap[params.experienceLevel] || '1')
    }
    
    // Job type
    if (params.jobType && params.jobType.length > 0) {
      const jobTypeMap: Record<string, string> = {
        'full-time': 'F',
        'part-time': 'P',
        'contract': 'C',
        'temporary': 'T'
      }
      const jobTypeCodes = params.jobType.map(type => jobTypeMap[type]).filter(Boolean)
      if (jobTypeCodes.length > 0) {
        searchParams.set('f_JT', jobTypeCodes.join(','))
      }
    }
    
    // Date posted
    if (params.datePosted) {
      const dateMap: Record<string, string> = {
        'past-24h': 'r86400',
        'past-week': 'r604800',
        'past-month': 'r2592000'
      }
      searchParams.set('f_TPR', dateMap[params.datePosted] || 'r2592000')
    }
    
    // Easy apply
    if (params.easyApply) {
      searchParams.set('f_LF', 'f_AL')
    }
    
    // Remote work
    if (params.remoteWork) {
      searchParams.set('f_WT', '2')
    }
    
    return `${baseUrl}?${searchParams.toString()}`
  }

  /**
   * Validate LinkedIn search parameters
   */
  static validateLinkedInParams(params: LinkedInSearchParams): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!params.keywords || params.keywords.length === 0) {
      errors.push('At least one keyword is required')
    }
    
    if (!params.location || params.location.length === 0) {
      errors.push('At least one location is required')
    }
    
    if (params.salaryRange) {
      if (params.salaryRange.min && params.salaryRange.max && params.salaryRange.min > params.salaryRange.max) {
        errors.push('Minimum salary cannot be greater than maximum salary')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}
