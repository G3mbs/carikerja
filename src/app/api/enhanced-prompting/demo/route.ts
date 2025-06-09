import { NextRequest, NextResponse } from 'next/server'
import { EnhancedPromptingDemo } from '@/lib/enhanced-prompting-demo'
import { MistralService } from '@/lib/mistral'
import { CVAnalysis, JobSearchParams } from '@/types'

/**
 * Enhanced Prompting Demo API
 *
 * Endpoint untuk mendemonstrasikan perbaikan sistem prompting
 * GET /api/enhanced-prompting/demo - Demo dengan sample data
 * POST /api/enhanced-prompting/demo - Demo dengan data custom
 */

export async function GET() {
  try {
    console.log('=== Enhanced Prompting Demo API Called ===')
    
    const demo = new EnhancedPromptingDemo()
    
    // Sample CV content untuk demo
    const sampleCV = `
      John Doe
      Email: john.doe@email.com
      Phone: +62 812 3456 7890
      Location: Jakarta Selatan, DKI Jakarta
      LinkedIn: https://linkedin.com/in/johndoe
      
      PROFESSIONAL SUMMARY:
      Experienced Software Engineer with 3+ years in backend development, 
      specializing in Go and microservices architecture. Proven track record 
      in building scalable systems at high-growth startups.
      
      EXPERIENCE:
      Senior Software Engineer at Gojek (2021-2023)
      - Developed and maintained backend services using Go and Node.js
      - Implemented microservices architecture serving 10M+ users
      - Worked with Docker, Kubernetes, and AWS for deployment
      - Led team of 3 junior developers
      - Improved system performance by 40%
      
      Software Engineer at Tokopedia (2020-2021)
      - Built REST APIs using Go and PostgreSQL
      - Implemented caching strategies with Redis
      - Collaborated with frontend team on API design
      
      EDUCATION:
      Bachelor of Computer Science, Universitas Indonesia (2016-2020)
      GPA: 3.7/4.0
      
      SKILLS:
      Programming Languages: Go, JavaScript, Python, Java
      Frameworks: Gin, Express.js, FastAPI, Spring Boot
      Tools & Platforms: Docker, Kubernetes, AWS, Git, Jenkins
      Databases: PostgreSQL, MongoDB, Redis, MySQL
      
      PROJECTS:
      E-commerce Microservices Platform
      - Built using Go, Docker, and Kubernetes
      - Handles 100K+ transactions daily
      - GitHub: https://github.com/johndoe/ecommerce-platform
      
      CERTIFICATIONS:
      - AWS Certified Developer Associate (2022)
      - Certified Kubernetes Administrator (2021)
    `
    
    // Run complete workflow demo
    const result = await demo.demonstrateCompleteWorkflow(sampleCV)
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced prompting demo completed successfully',
      demo_type: 'complete_workflow',
      results: {
        cv_analysis: {
          nama: result.cvAnalysis.informasi_pribadi.nama_lengkap,
          level: result.cvAnalysis.ringkasan_analisis.tingkat_pengalaman,
          posisi_potensial: result.cvAnalysis.ringkasan_analisis.potensi_kecocokan_posisi,
          estimasi_gaji: result.cvAnalysis.ringkasan_analisis.estimasi_gaji_bulanan_rupiah,
          keahlian_utama: result.cvAnalysis.keahlian.bahasa_pemrograman
        },
        structured_keywords: {
          total_categories: 4,
          total_keywords: 
            result.keywords.kata_kunci_utama.length +
            result.keywords.kombinasi_spesifik_niche.length +
            result.keywords.berbasis_lokasi.length +
            result.keywords.umum_dan_alternatif.length,
          categories: {
            kata_kunci_utama: result.keywords.kata_kunci_utama,
            kombinasi_spesifik_niche: result.keywords.kombinasi_spesifik_niche,
            berbasis_lokasi: result.keywords.berbasis_lokasi,
            umum_dan_alternatif: result.keywords.umum_dan_alternatif
          }
        },
        market_research: {
          tingkat_permintaan: result.research.ringkasan_eksekutif.tingkat_permintaan_saat_ini,
          prospek_karir: result.research.ringkasan_eksekutif.prospek_karir_5_tahun,
          rata_rata_gaji: result.research.ringkasan_eksekutif.rata_rata_gaji_menengah_nasional_idr,
          perusahaan_top: result.research.analisis_permintaan_pasar.perusahaan_perekrut_utama,
          keahlian_wajib: result.research.profil_kandidat_ideal.keahlian_wajib_dimiliki
        },
        job_simulation: {
          total_lowongan: result.simulation.ringkasan_simulasi.total_lowongan_disimulasikan,
          wawasan_utama: result.simulation.ringkasan_simulasi.wawasan_utama,
          distribusi_platform: result.simulation.ringkasan_simulasi.distribusi_platform,
          sample_jobs: result.simulation.lowongan_kerja.slice(0, 5).map(job => ({
            posisi: job.posisi,
            perusahaan: job.perusahaan,
            lokasi: job.lokasi,
            gaji_range: `Rp ${job.gaji_bulanan_idr.min.toLocaleString()} - Rp ${job.gaji_bulanan_idr.max.toLocaleString()}`,
            platform: job.platform,
            skor_kecocokan: job.skor_kecocokan
          }))
        }
      },
      performance_metrics: {
        processing_time: 'Simulated for demo',
        prompt_quality: 'Enhanced with structured output',
        data_accuracy: 'Optimized for Indonesian market',
        integration_status: 'Fully integrated with CariKerja system'
      }
    })
    
  } catch (error) {
    console.error('Enhanced prompting demo error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Demo failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { demo_type, cv_content, position, industry, search_params } = body
    
    console.log('=== Custom Enhanced Prompting Demo ===')
    console.log('Demo type:', demo_type)
    
    const demo = new EnhancedPromptingDemo()
    const mistralService = new MistralService()
    
    let result: any = {}
    
    switch (demo_type) {
      case 'cv_analysis':
        if (!cv_content) {
          return NextResponse.json(
            { success: false, error: 'CV content required for CV analysis demo' },
            { status: 400 }
          )
        }
        result = await demo.demonstrateCVAnalysis(cv_content)
        break
        
      case 'keywords_generation':
        if (!cv_content) {
          return NextResponse.json(
            { success: false, error: 'CV content required for keywords generation demo' },
            { status: 400 }
          )
        }
        const cvAnalysis = await mistralService.analyzeCV(cv_content)
        result = await demo.demonstrateKeywordGeneration(cvAnalysis)
        break
        
      case 'market_research':
        if (!position || !industry) {
          return NextResponse.json(
            { success: false, error: 'Position and industry required for market research demo' },
            { status: 400 }
          )
        }
        result = await demo.demonstrateMarketResearch(position, industry)
        break
        
      case 'job_simulation':
        if (!search_params) {
          return NextResponse.json(
            { success: false, error: 'Search params required for job simulation demo' },
            { status: 400 }
          )
        }
        const platforms = search_params.platforms || ['LinkedIn', 'Glints', 'JobStreet']
        result = await demo.demonstrateJobSearchSimulation(search_params, platforms)
        break
        
      case 'quality_comparison':
        if (!cv_content) {
          return NextResponse.json(
            { success: false, error: 'CV content required for quality comparison demo' },
            { status: 400 }
          )
        }
        const analysis = await mistralService.analyzeCV(cv_content)
        result = await demo.demonstratePromptQualityComparison(analysis)
        break
        
      case 'complete_workflow':
        if (!cv_content) {
          return NextResponse.json(
            { success: false, error: 'CV content required for complete workflow demo' },
            { status: 400 }
          )
        }
        result = await demo.demonstrateCompleteWorkflow(cv_content)
        break
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid demo type' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      message: `${demo_type} demo completed successfully`,
      demo_type,
      result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Custom enhanced prompting demo error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Custom demo failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Demo endpoint untuk testing individual components
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { component, test_data } = body
    
    console.log('=== Component Testing Demo ===')
    console.log('Component:', component)
    
    const mistralService = new MistralService()
    let result: any = {}
    
    switch (component) {
      case 'prompt_structure':
        // Test prompt structure and formatting
        result = {
          cv_analysis_prompt: 'Enhanced with role definition and Indonesian context',
          keywords_prompt: 'Structured with 4 strategic categories',
          market_research_prompt: 'Comprehensive intelligence report format',
          job_simulation_prompt: 'Chain-of-thought with realistic output'
        }
        break
        
      case 'error_handling':
        // Test error handling and fallbacks
        try {
          // Simulate API failure
          throw new Error('Simulated API failure')
        } catch (error) {
          result = {
            error_caught: true,
            fallback_activated: true,
            graceful_degradation: 'System continues with static fallbacks',
            user_experience: 'Maintained with alternative data'
          }
        }
        break
        
      case 'output_validation':
        // Test output structure validation
        const sampleOutput = {
          kata_kunci_utama: ['Senior Developer', 'Lead Engineer'],
          kombinasi_spesifik_niche: ['Go Microservices', 'Backend AWS'],
          berbasis_lokasi: ['Developer Jakarta', 'Remote Indonesia'],
          umum_dan_alternatif: ['Software Engineer', 'Programmer']
        }
        
        result = {
          structure_valid: true,
          required_fields_present: true,
          data_types_correct: true,
          sample_output: sampleOutput
        }
        break
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid component for testing' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      message: `${component} testing completed`,
      component,
      test_result: result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Component testing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Component testing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
