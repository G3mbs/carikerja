// CV Analysis Types
export interface CVAnalysis {
  informasi_pribadi: {
    nama_lengkap: string | null
    email: string | null
    nomor_telepon: string | null
    lokasi: string | null
    url_linkedin: string | null
    url_portfolio_github: string | null
  }
  ringkasan_analisis: {
    profil_singkat_kandidat: string
    tingkat_pengalaman: 'Fresh Graduate' | 'Junior' | 'Menengah' | 'Senior' | 'Ahli'
    justifikasi_tingkat_pengalaman: string
    estimasi_gaji_bulanan_rupiah: {
      rentang_bawah: number | null
      rentang_atas: number | null
      justifikasi_estimasi: string
    }
    potensi_kecocokan_posisi: string[]
    catatan_untuk_perekrut: string
  }
  ringkasan_profil_cv: string | null
  pengalaman_kerja: {
    posisi: string
    perusahaan: string
    lokasi: string | null
    tanggal_mulai: string
    tanggal_selesai: string
    durasi: string
    deskripsi_tugas: string[]
    pencapaian_kunci: string[]
  }[]
  pendidikan: {
    institusi: string
    gelar: string
    bidang_studi: string
    tahun_lulus: number | null
    nilai_ipk: number | null
  }[]
  keahlian: {
    keahlian_teknis: string[]
    soft_skills: string[]
    tools_platform: string[]
    bahasa_pemrograman: string[]
  }
  proyek: {
    nama_proyek: string
    deskripsi: string
    teknologi_yang_digunakan: string[]
    url_proyek: string | null
  }[]
  sertifikasi_dan_pelatihan: {
    nama_sertifikasi: string
    penerbit: string
    tahun: number | null
  }[]
  bahasa: {
    nama_bahasa: string
    tingkat_kemahiran: string
  }[]
}

// Job Search Types
export interface JobSearchParams {
  keywords: string[]
  location: string[]
  salaryRange: {
    min: number
    max: number
  }
  experienceLevel: string
  companyType: string[]
  industry: string[]
}

export interface JobResult {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  description: string
  requirements: string[]
  benefits?: string[]
  url: string
  platform: string
  postedDate: string
  matchScore?: number
}

// Browser Automation Types
export interface BrowserTask {
  id: string
  type: 'job_search' | 'job_apply' | 'profile_update'
  status: 'pending' | 'running' | 'completed' | 'failed'
  platform: string
  parameters: any
  results?: any
  error?: string
  createdAt: string
  updatedAt: string
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

// CV Types
export interface CV {
  id: string
  userId: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  analysis?: CVAnalysis
  version: number
  isActive: boolean
}

// Market Research Types
export interface MarketResearch {
  id: string
  userId: string
  industry: string
  position: string
  location: string
  salaryBenchmark: {
    min: number
    max: number
    average: number
    currency: string
  }
  skillDemand: {
    skill: string
    demand: 'high' | 'medium' | 'low'
    growth: number
  }[]
  careerPath: {
    currentLevel: string
    nextLevel: string
    timeframe: string
    requirements: string[]
  }[]
  companies: {
    name: string
    type: string
    size: string
    hiring: boolean
  }[]
  trends: string[]
  createdAt: string
}

// Job Alert Types
export interface JobAlert {
  id: string
  userId: string
  name: string
  searchParams: JobSearchParams
  isActive: boolean
  frequency: 'daily' | 'weekly' | 'instant'
  lastRun?: string
  createdAt: string
  updatedAt: string
}

// Structured Keywords Types
export interface StructuredKeywords {
  kata_kunci_utama: string[]
  kombinasi_spesifik_niche: string[]
  berbasis_lokasi: string[]
  umum_dan_alternatif: string[]
}

// Market Research Types (Enhanced)
export interface MarketResearchReport {
  ringkasan_eksekutif: {
    kesimpulan_utama: string[]
    tingkat_permintaan_saat_ini: 'Sangat Tinggi' | 'Tinggi' | 'Sedang' | 'Rendah' | 'Sangat Rendah'
    prospek_karir_5_tahun: 'Sangat Menjanjikan' | 'Menjanjikan' | 'Stabil' | 'Menurun'
    rata_rata_gaji_menengah_nasional_idr: number
  }
  analisis_permintaan_pasar: {
    volume_lowongan_rata_rata: string
    perusahaan_perekrut_utama: string[]
    distribusi_geografis_utama: string[]
    sub_sektor_industri_paling_aktif: string[]
  }
  profil_kandidat_ideal: {
    kualifikasi_pendidikan_umum: string[]
    keahlian_wajib_dimiliki: {
      teknis_dan_pemrograman: string[]
      tools_dan_platform: string[]
      metodologi_dan_kerangka_kerja: string[]
      soft_skills_paling_kritis: string[]
    }
    sertifikasi_yang_sangat_dihargai: string[]
  }
  benchmark_kompensasi_dan_benefit: {
    catatan_analisis_gaji: string
    rentang_gaji_bulanan_idr: {
      fresh_graduate_entry_level: { min: number; max: number; rata_rata: number }
      junior_1_3_tahun: { min: number; max: number; rata_rata: number }
      menengah_3_6_tahun: { min: number; max: number; rata_rata: number }
      senior_diatas_6_tahun: { min: number; max: number; rata_rata: number }
      level_lead_principal: { min: number; max: number; rata_rata: number }
    }
    variasi_gaji_antar_kota: string
    struktur_bonus_tipikal: string[]
    tunjangan_dan_benefit_populer: string[]
  }
  proyeksi_dan_jalur_karir: {
    jalur_karir_vertikal_tipikal: string[]
    jalur_karir_lateral_alternatif: string[]
    keahlian_untuk_dipelajari_2_3_tahun_kedepan: string[]
    risiko_otomatisasi_dan_peran_ai: string
  }
  wawasan_proses_rekrutmen: {
    tahapan_interview_umum: string[]
    topik_pertanyaan_teknis_umum: string[]
    saran_untuk_kandidat: string
    saran_untuk_perekrut: string
  }
}

// Job Search Simulation Types
export interface JobSearchSimulation {
  ringkasan_simulasi: {
    query_pencarian: string
    total_lowongan_disimulasikan: number
    wawasan_utama: string
    distribusi_platform: Record<string, number>
  }
  lowongan_kerja: SimulatedJobResult[]
}

export interface SimulatedJobResult {
  posisi: string
  perusahaan: string
  lokasi: string
  model_kerja: 'On-site' | 'Hybrid' | 'Remote'
  gaji_bulanan_idr: {
    min: number
    max: number
  }
  deskripsi_singkat: string
  tanggung_jawab_utama: string[]
  kualifikasi_wajib: string[]
  benefit_unggulan: string[]
  url_palsu: string
  platform: string
  tanggal_diposting: string
  skor_kecocokan: number
}

// Job Application Management Types
export interface JobApplication {
  id: string
  userId: string
  cvId?: string

  // Basic job information
  companyName: string
  positionTitle: string
  jobUrl?: string
  applicationDate: string

  // Application status
  status: ApplicationStatus

  // Additional details
  location?: string
  salaryOffered?: number
  salaryCurrency: string
  employmentType?: EmploymentType
  workArrangement?: WorkArrangement

  // Contact information
  hrContact?: string
  hrEmail?: string
  hrPhone?: string

  // Application tracking
  applicationMethod?: string
  referralSource?: string

  // Notes and documents
  notes?: string
  coverLetterUsed?: string
  documentsSubmitted?: string[]

  // Interview and assessment
  interviewRounds: number
  nextInterviewDate?: string
  assessmentType?: string
  assessmentDeadline?: string

  // Offer details
  offerReceivedDate?: string
  offerDeadline?: string
  offerSalary?: number
  offerBenefits?: string

  // Integration fields
  taskId?: string
  linkedinJobId?: string
  cvData?: any
  automationResults?: any

  // Metadata
  createdAt: string
  updatedAt: string
}

export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'assessment'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'hired'
  | 'withdrawn'

export type EmploymentType =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'internship'
  | 'freelance'

export type WorkArrangement =
  | 'remote'
  | 'hybrid'
  | 'onsite'

export interface ApplicationDocument {
  id: string
  applicationId: string
  userId: string
  documentType: DocumentType
  fileName: string
  filePath: string
  fileSize?: number
  mimeType?: string
  version: number
  isActive: boolean
  uploadedAt: string
}

export type DocumentType =
  | 'cv'
  | 'cover_letter'
  | 'portfolio'
  | 'certificate'
  | 'transcript'
  | 'reference'

export interface ApplicationActivity {
  id: string
  applicationId: string
  userId: string
  activityType: ActivityType
  oldValue?: string
  newValue?: string
  description?: string
  metadata?: any
  createdAt: string
}

export type ActivityType =
  | 'status_change'
  | 'note_added'
  | 'document_uploaded'
  | 'interview_scheduled'
  | 'offer_received'
  | 'application_created'
  | 'application_updated'

// Dashboard Statistics Types
export interface ApplicationStats {
  total: number
  byStatus: Record<ApplicationStatus, number>
  recentApplications: number
  upcomingInterviews: number
  pendingOffers: number
  averageResponseTime: number
}

export interface ApplicationTrend {
  date: string
  applications: number
  interviews: number
  offers: number
}

// Filter and Search Types
export interface ApplicationFilters {
  status?: ApplicationStatus[]
  companyName?: string
  positionTitle?: string
  location?: string
  applicationDateFrom?: string
  applicationDateTo?: string
  salaryMin?: number
  salaryMax?: number
  employmentType?: EmploymentType[]
  workArrangement?: WorkArrangement[]
}

export interface ApplicationSortOptions {
  field: 'applicationDate' | 'companyName' | 'positionTitle' | 'status' | 'salaryOffered'
  direction: 'asc' | 'desc'
}

// Form Types
export interface ApplicationFormData {
  companyName: string
  positionTitle: string
  jobUrl?: string
  applicationDate: string
  status: ApplicationStatus
  location?: string
  salaryOffered?: number
  salaryCurrency: string
  employmentType?: EmploymentType
  workArrangement?: WorkArrangement
  hrContact?: string
  hrEmail?: string
  hrPhone?: string
  applicationMethod?: string
  referralSource?: string
  notes?: string
  coverLetterUsed?: string
}

// Re-export LinkedIn types
export * from './linkedin'
