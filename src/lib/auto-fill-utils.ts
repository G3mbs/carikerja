/**
 * Auto-Fill Utilities for Job Search Parameters
 * 
 * Utility functions untuk mengisi otomatis parameter pencarian kerja
 * berdasarkan hasil analisis CV menggunakan Enhanced Prompting System
 */

import { CVAnalysis, JobSearchParams } from '@/types'

export interface AutoFillResult {
  keywords: string[]
  location: string[]
  salaryRange: {
    min: number
    max: number
  }
  experienceLevel: string
  isAutoFilled: boolean
  autoFilledFields: string[]
  source: 'cv_analysis' | 'default' | 'mixed'
}

export interface AutoFillIndicators {
  keywords: boolean
  location: boolean
  salaryRange: boolean
  experienceLevel: boolean
}

/**
 * Default salary ranges berdasarkan level pengalaman
 */
const DEFAULT_SALARY_RANGES = {
  'fresh_graduate': { min: 5000000, max: 10000000 },
  'entry': { min: 5000000, max: 10000000 },
  'junior': { min: 8000000, max: 15000000 },
  'mid': { min: 12000000, max: 25000000 },
  'menengah': { min: 12000000, max: 25000000 },
  'senior': { min: 20000000, max: 40000000 },
  'ahli': { min: 30000000, max: 60000000 },
  'expert': { min: 30000000, max: 60000000 },
  'any': { min: 8000000, max: 20000000 }
} as const

/**
 * Mapping level pengalaman dari CV analysis ke format yang digunakan sistem
 */
const EXPERIENCE_LEVEL_MAPPING = {
  'Fresh Graduate': 'entry',
  'Junior': 'junior', 
  'Menengah': 'mid',
  'Senior': 'senior',
  'Ahli': 'expert'
} as const

/**
 * Auto-fill keywords dari CV analysis
 */
export function autoFillKeywords(cvAnalysis?: CVAnalysis): { keywords: string[], isAutoFilled: boolean } {
  if (!cvAnalysis?.ringkasan_analisis?.potensi_kecocokan_posisi) {
    return { keywords: [], isAutoFilled: false }
  }

  const keywords = cvAnalysis.ringkasan_analisis.potensi_kecocokan_posisi.filter(Boolean)
  return {
    keywords,
    isAutoFilled: keywords.length > 0
  }
}

/**
 * Auto-fill lokasi dari CV analysis
 */
export function autoFillLocation(cvAnalysis?: CVAnalysis): { location: string[], isAutoFilled: boolean } {
  const cvLocation = cvAnalysis?.informasi_pribadi?.lokasi

  if (cvLocation && cvLocation.trim()) {
    // Extract city from location string (e.g., "Jakarta Selatan, DKI Jakarta" -> "Jakarta")
    const cleanLocation = cvLocation.split(',')[0].trim()
    const cityName = cleanLocation.includes('Jakarta') ? 'Jakarta' : cleanLocation
    
    return {
      location: [cityName],
      isAutoFilled: true
    }
  }

  // Default to Jakarta if no location in CV
  return {
    location: ['Jakarta'],
    isAutoFilled: false
  }
}

/**
 * Auto-fill salary range dari CV analysis atau default berdasarkan level
 */
export function autoFillSalaryRange(cvAnalysis?: CVAnalysis): { 
  salaryRange: { min: number, max: number }, 
  isAutoFilled: boolean,
  source: 'cv_analysis' | 'experience_level' | 'default'
} {
  // Prioritas 1: Gunakan estimasi gaji dari CV analysis
  const cvSalary = cvAnalysis?.ringkasan_analisis?.estimasi_gaji_bulanan_rupiah
  if (cvSalary?.rentang_bawah && cvSalary?.rentang_atas) {
    return {
      salaryRange: {
        min: cvSalary.rentang_bawah,
        max: cvSalary.rentang_atas
      },
      isAutoFilled: true,
      source: 'cv_analysis'
    }
  }

  // Prioritas 2: Gunakan default berdasarkan level pengalaman
  const experienceLevel = cvAnalysis?.ringkasan_analisis?.tingkat_pengalaman
  if (experienceLevel) {
    const mappedLevel = EXPERIENCE_LEVEL_MAPPING[experienceLevel as keyof typeof EXPERIENCE_LEVEL_MAPPING]
    const defaultRange = DEFAULT_SALARY_RANGES[mappedLevel] || DEFAULT_SALARY_RANGES.any

    return {
      salaryRange: defaultRange,
      isAutoFilled: true,
      source: 'experience_level'
    }
  }

  // Prioritas 3: Default umum
  return {
    salaryRange: DEFAULT_SALARY_RANGES.any,
    isAutoFilled: false,
    source: 'default'
  }
}

/**
 * Auto-fill experience level dari CV analysis
 */
export function autoFillExperienceLevel(cvAnalysis?: CVAnalysis): { 
  experienceLevel: string, 
  isAutoFilled: boolean 
} {
  const cvLevel = cvAnalysis?.ringkasan_analisis?.tingkat_pengalaman

  if (cvLevel) {
    const mappedLevel = EXPERIENCE_LEVEL_MAPPING[cvLevel as keyof typeof EXPERIENCE_LEVEL_MAPPING]
    if (mappedLevel) {
      return {
        experienceLevel: mappedLevel,
        isAutoFilled: true
      }
    }
  }

  return {
    experienceLevel: 'any',
    isAutoFilled: false
  }
}

/**
 * Main function untuk auto-fill semua parameter pencarian kerja
 */
export function autoFillJobSearchParams(cvAnalysis?: CVAnalysis): AutoFillResult {
  const keywordsResult = autoFillKeywords(cvAnalysis)
  const locationResult = autoFillLocation(cvAnalysis)
  const salaryResult = autoFillSalaryRange(cvAnalysis)
  const experienceResult = autoFillExperienceLevel(cvAnalysis)

  const autoFilledFields: string[] = []
  if (keywordsResult.isAutoFilled) autoFilledFields.push('keywords')
  if (locationResult.isAutoFilled) autoFilledFields.push('location')
  if (salaryResult.isAutoFilled) autoFilledFields.push('salaryRange')
  if (experienceResult.isAutoFilled) autoFilledFields.push('experienceLevel')

  const isAutoFilled = autoFilledFields.length > 0
  const hasAnalysisData = !!cvAnalysis?.ringkasan_analisis
  
  let source: 'cv_analysis' | 'default' | 'mixed' = 'default'
  if (hasAnalysisData && autoFilledFields.length > 0) {
    source = autoFilledFields.length === 4 ? 'cv_analysis' : 'mixed'
  }

  return {
    keywords: keywordsResult.keywords,
    location: locationResult.location,
    salaryRange: salaryResult.salaryRange,
    experienceLevel: experienceResult.experienceLevel,
    isAutoFilled,
    autoFilledFields,
    source
  }
}

/**
 * Generate auto-fill indicators untuk UI
 */
export function getAutoFillIndicators(cvAnalysis?: CVAnalysis): AutoFillIndicators {
  const keywordsResult = autoFillKeywords(cvAnalysis)
  const locationResult = autoFillLocation(cvAnalysis)
  const salaryResult = autoFillSalaryRange(cvAnalysis)
  const experienceResult = autoFillExperienceLevel(cvAnalysis)

  return {
    keywords: keywordsResult.isAutoFilled,
    location: locationResult.isAutoFilled,
    salaryRange: salaryResult.isAutoFilled,
    experienceLevel: experienceResult.isAutoFilled
  }
}

/**
 * Generate tooltip messages untuk auto-filled fields
 */
export function getAutoFillTooltip(field: keyof AutoFillIndicators, cvAnalysis?: CVAnalysis): string {
  const indicators = getAutoFillIndicators(cvAnalysis)
  
  if (!indicators[field]) {
    return 'Nilai default'
  }

  const tooltips = {
    keywords: 'Berdasarkan analisis CV - posisi yang cocok',
    location: 'Berdasarkan analisis CV - lokasi kandidat',
    salaryRange: cvAnalysis?.ringkasan_analisis?.estimasi_gaji_bulanan_rupiah?.rentang_bawah 
      ? 'Berdasarkan analisis CV - estimasi gaji'
      : 'Berdasarkan level pengalaman dari CV',
    experienceLevel: 'Berdasarkan analisis CV - tingkat pengalaman'
  }

  return tooltips[field]
}

/**
 * Validate auto-filled parameters
 */
export function validateAutoFilledParams(params: AutoFillResult): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate keywords
  if (params.keywords.length === 0) {
    errors.push('Minimal satu kata kunci diperlukan')
  }

  // Validate location
  if (params.location.length === 0) {
    errors.push('Minimal satu lokasi diperlukan')
  }

  // Validate salary range
  if (params.salaryRange.min >= params.salaryRange.max) {
    errors.push('Gaji minimum harus lebih kecil dari gaji maksimum')
  }

  if (params.salaryRange.min < 3000000) {
    warnings.push('Gaji minimum mungkin terlalu rendah untuk pasar Indonesia')
  }

  if (params.salaryRange.max > 100000000) {
    warnings.push('Gaji maksimum mungkin terlalu tinggi')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Format salary untuk display
 */
export function formatSalaryRange(min: number, max: number): string {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  return `Rp ${formatNumber(min)} - Rp ${formatNumber(max)}`
}

/**
 * Get experience level display name
 */
export function getExperienceLevelDisplayName(level: string): string {
  const displayNames = {
    'entry': 'Fresh Graduate / Entry Level',
    'junior': 'Junior (1-3 tahun)',
    'mid': 'Mid-level (3-6 tahun)', 
    'senior': 'Senior (6+ tahun)',
    'expert': 'Expert / Lead (10+ tahun)',
    'any': 'Semua Level'
  }

  return displayNames[level as keyof typeof displayNames] || level
}
