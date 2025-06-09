/**
 * Enhanced Prompting System Demo
 * 
 * Demonstrasi penggunaan sistem prompting yang telah diperbaiki untuk:
 * 1. Generasi kata kunci pencarian kerja yang terstruktur
 * 2. Riset pasar kerja yang mendalam
 * 3. Simulasi pencarian kerja yang realistis
 */

import { MistralService } from './mistral'
import { BrowserUseService } from './browser-use'
import { CVAnalysis, JobSearchParams } from '@/types'

export class EnhancedPromptingDemo {
  private mistralService: MistralService
  private browserService: BrowserUseService

  constructor() {
    this.mistralService = new MistralService()
    this.browserService = new BrowserUseService()
  }

  /**
   * Demo 1: Enhanced CV Analysis dengan prompt yang diperbaiki
   */
  async demonstrateCVAnalysis(cvContent: string) {
    console.log('=== DEMO: Enhanced CV Analysis ===')
    
    try {
      const analysis = await this.mistralService.analyzeCV(cvContent)
      
      console.log('✅ CV Analysis berhasil dengan struktur yang diperbaiki:')
      console.log('- Informasi pribadi:', analysis.informasi_pribadi)
      console.log('- Level pengalaman:', analysis.ringkasan_analisis.tingkat_pengalaman)
      console.log('- Estimasi gaji:', analysis.ringkasan_analisis.estimasi_gaji_bulanan_rupiah)
      console.log('- Potensi posisi:', analysis.ringkasan_analisis.potensi_kecocokan_posisi)
      
      return analysis
    } catch (error) {
      console.error('❌ CV Analysis gagal:', error)
      throw error
    }
  }

  /**
   * Demo 2: Structured Keywords Generation
   */
  async demonstrateKeywordGeneration(cvAnalysis: CVAnalysis) {
    console.log('\n=== DEMO: Structured Keywords Generation ===')
    
    try {
      const keywords = await this.mistralService.generateJobSearchKeywords(cvAnalysis)
      
      console.log('✅ Kata kunci terstruktur berhasil digenerate:')
      console.log('- Kata kunci utama:', keywords.kata_kunci_utama)
      console.log('- Kombinasi spesifik niche:', keywords.kombinasi_spesifik_niche)
      console.log('- Berbasis lokasi:', keywords.berbasis_lokasi)
      console.log('- Umum & alternatif:', keywords.umum_dan_alternatif)
      
      return keywords
    } catch (error) {
      console.error('❌ Keyword generation gagal:', error)
      throw error
    }
  }

  /**
   * Demo 3: Market Research dengan prompt yang diperbaiki
   */
  async demonstrateMarketResearch(position: string, industry: string, location: string = 'Indonesia') {
    console.log('\n=== DEMO: Enhanced Market Research ===')
    
    try {
      const research = await this.mistralService.conductMarketResearch(position, industry, location)
      
      console.log('✅ Market research berhasil dengan struktur yang komprehensif:')
      console.log('- Tingkat permintaan:', research.ringkasan_eksekutif.tingkat_permintaan_saat_ini)
      console.log('- Prospek karir:', research.ringkasan_eksekutif.prospek_karir_5_tahun)
      console.log('- Rata-rata gaji:', research.ringkasan_eksekutif.rata_rata_gaji_menengah_nasional_idr)
      console.log('- Perusahaan perekrut utama:', research.analisis_permintaan_pasar.perusahaan_perekrut_utama)
      console.log('- Keahlian wajib:', research.profil_kandidat_ideal.keahlian_wajib_dimiliki)
      
      return research
    } catch (error) {
      console.error('❌ Market research gagal:', error)
      throw error
    }
  }

  /**
   * Demo 4: Job Search Simulation dengan prompt yang diperbaiki
   */
  async demonstrateJobSearchSimulation(params: JobSearchParams, platforms: string[]) {
    console.log('\n=== DEMO: Enhanced Job Search Simulation ===')
    
    try {
      const simulation = await this.mistralService.generateJobSearchSimulation(params, platforms)
      
      console.log('✅ Job search simulation berhasil:')
      console.log('- Query pencarian:', simulation.ringkasan_simulasi.query_pencarian)
      console.log('- Total lowongan:', simulation.ringkasan_simulasi.total_lowongan_disimulasikan)
      console.log('- Wawasan utama:', simulation.ringkasan_simulasi.wawasan_utama)
      console.log('- Distribusi platform:', simulation.ringkasan_simulasi.distribusi_platform)
      console.log('- Jumlah lowongan digenerate:', simulation.lowongan_kerja.length)
      
      // Show sample jobs
      console.log('\n📋 Sample lowongan kerja:')
      simulation.lowongan_kerja.slice(0, 3).forEach((job, index) => {
        console.log(`${index + 1}. ${job.posisi} di ${job.perusahaan}`)
        console.log(`   Lokasi: ${job.lokasi} | Model: ${job.model_kerja}`)
        console.log(`   Gaji: Rp ${job.gaji_bulanan_idr.min.toLocaleString()} - Rp ${job.gaji_bulanan_idr.max.toLocaleString()}`)
        console.log(`   Platform: ${job.platform} | Skor: ${job.skor_kecocokan}`)
      })
      
      return simulation
    } catch (error) {
      console.error('❌ Job search simulation gagal:', error)
      throw error
    }
  }

  /**
   * Demo 5: End-to-End Workflow
   */
  async demonstrateCompleteWorkflow(cvContent: string) {
    console.log('\n=== DEMO: Complete Enhanced Workflow ===')
    
    try {
      // Step 1: Analyze CV
      console.log('🔍 Step 1: Analyzing CV...')
      const cvAnalysis = await this.demonstrateCVAnalysis(cvContent)
      
      // Step 2: Generate keywords
      console.log('\n🔑 Step 2: Generating structured keywords...')
      const keywords = await this.demonstrateKeywordGeneration(cvAnalysis)
      
      // Step 3: Market research
      console.log('\n📊 Step 3: Conducting market research...')
      const position = cvAnalysis.ringkasan_analisis.potensi_kecocokan_posisi[0]
      const research = await this.demonstrateMarketResearch(position, 'Technology')
      
      // Step 4: Job search simulation
      console.log('\n🔍 Step 4: Simulating job search...')
      const searchParams: JobSearchParams = {
        keywords: keywords.kata_kunci_utama,
        location: [cvAnalysis.informasi_pribadi.lokasi || 'Jakarta'],
        salaryRange: {
          min: cvAnalysis.ringkasan_analisis.estimasi_gaji_bulanan_rupiah.rentang_bawah || 8000000,
          max: cvAnalysis.ringkasan_analisis.estimasi_gaji_bulanan_rupiah.rentang_atas || 15000000
        },
        experienceLevel: cvAnalysis.ringkasan_analisis.tingkat_pengalaman.toLowerCase().replace(' ', '_'),
        companyType: ['startup', 'corporate'],
        industry: ['technology', 'fintech']
      }
      
      const simulation = await this.demonstrateJobSearchSimulation(searchParams, ['LinkedIn', 'Glints', 'JobStreet'])
      
      console.log('\n✅ Complete workflow berhasil!')
      console.log('📈 Summary:')
      console.log(`- CV dianalisis untuk ${cvAnalysis.informasi_pribadi.nama_lengkap}`)
      console.log(`- ${keywords.kata_kunci_utama.length + keywords.kombinasi_spesifik_niche.length} kata kunci digenerate`)
      console.log(`- Market research untuk posisi ${position}`)
      console.log(`- ${simulation.lowongan_kerja.length} lowongan kerja disimulasikan`)
      
      return {
        cvAnalysis,
        keywords,
        research,
        simulation
      }
    } catch (error) {
      console.error('❌ Complete workflow gagal:', error)
      throw error
    }
  }

  /**
   * Demo 6: Prompt Quality Comparison
   */
  async demonstratePromptQualityComparison(cvAnalysis: CVAnalysis) {
    console.log('\n=== DEMO: Prompt Quality Comparison ===')
    
    console.log('🔄 Comparing old vs new prompting approach...')
    
    // Old approach (simple keywords)
    const oldKeywords = cvAnalysis.ringkasan_analisis.potensi_kecocokan_posisi
    
    // New approach (structured keywords)
    const newKeywords = await this.mistralService.generateJobSearchKeywords(cvAnalysis)
    
    console.log('\n📊 Comparison Results:')
    console.log('Old approach (simple list):')
    console.log('- Keywords:', oldKeywords)
    console.log('- Total:', oldKeywords.length)
    console.log('- Structure: Flat array')
    
    console.log('\nNew approach (structured):')
    console.log('- Kata kunci utama:', newKeywords.kata_kunci_utama.length)
    console.log('- Kombinasi spesifik:', newKeywords.kombinasi_spesifik_niche.length)
    console.log('- Berbasis lokasi:', newKeywords.berbasis_lokasi.length)
    console.log('- Umum & alternatif:', newKeywords.umum_dan_alternatif.length)
    console.log('- Total keywords:', 
      newKeywords.kata_kunci_utama.length + 
      newKeywords.kombinasi_spesifik_niche.length + 
      newKeywords.berbasis_lokasi.length + 
      newKeywords.umum_dan_alternatif.length
    )
    console.log('- Structure: Categorized and strategic')
    
    console.log('\n✅ New approach provides:')
    console.log('- Better categorization')
    console.log('- More strategic combinations')
    console.log('- Location-based targeting')
    console.log('- Higher search coverage')
    
    return { oldKeywords, newKeywords }
  }
}

/**
 * Usage Example
 */
export async function runEnhancedPromptingDemo() {
  const demo = new EnhancedPromptingDemo()
  
  // Sample CV content for demo
  const sampleCV = `
    John Doe
    Email: john.doe@email.com
    Phone: +62 812 3456 7890
    Location: Jakarta Selatan, DKI Jakarta
    
    EXPERIENCE:
    Software Engineer at Gojek (2021-2023)
    - Developed backend services using Go and Node.js
    - Implemented microservices architecture
    - Worked with Docker, Kubernetes, and AWS
    
    EDUCATION:
    Bachelor of Computer Science, Universitas Indonesia (2017-2021)
    
    SKILLS:
    - Programming: Go, JavaScript, Python
    - Frameworks: Express.js, Gin, FastAPI
    - Tools: Docker, Kubernetes, AWS, Git
    - Databases: PostgreSQL, MongoDB, Redis
  `
  
  try {
    await demo.demonstrateCompleteWorkflow(sampleCV)
  } catch (error) {
    console.error('Demo failed:', error)
  }
}
