import { NextRequest, NextResponse } from 'next/server'
import { autoFillJobSearchParams, validateAutoFilledParams } from '@/lib/auto-fill-utils'
import { CVAnalysis } from '@/types'

/**
 * Auto-Fill Test API
 * 
 * Endpoint untuk testing fitur auto-fill parameter pencarian kerja
 * GET /api/auto-fill/test - Test dengan sample CV data
 * POST /api/auto-fill/test - Test dengan custom CV analysis data
 */

export async function GET() {
  try {
    console.log('=== Auto-Fill Test API Called ===')
    
    // Sample CV analysis data untuk testing
    const sampleCVAnalysis: CVAnalysis = {
      informasi_pribadi: {
        nama_lengkap: 'John Doe',
        email: 'john.doe@email.com',
        nomor_telepon: '+62 812 3456 7890',
        lokasi: 'Jakarta Selatan, DKI Jakarta',
        url_linkedin: 'https://linkedin.com/in/johndoe',
        url_portfolio_github: 'https://github.com/johndoe'
      },
      ringkasan_analisis: {
        profil_singkat_kandidat: 'Software Engineer berpengalaman dengan keahlian backend development',
        tingkat_pengalaman: 'Senior',
        justifikasi_tingkat_pengalaman: 'Memiliki 5+ tahun pengalaman di perusahaan teknologi besar',
        estimasi_gaji_bulanan_rupiah: {
          rentang_bawah: 18000000,
          rentang_atas: 28000000,
          justifikasi_estimasi: 'Berdasarkan pengalaman senior dan keahlian teknologi yang dimiliki'
        },
        potensi_kecocokan_posisi: [
          'Senior Backend Developer',
          'Lead Software Engineer',
          'Principal Engineer'
        ],
        catatan_untuk_perekrut: 'Kandidat yang sangat qualified dengan track record yang baik'
      },
      keahlian: {
        keahlian_teknis: ['Backend Development', 'System Architecture', 'Database Design'],
        bahasa_pemrograman: ['Go', 'JavaScript', 'Python'],
        tools_platform: ['Docker', 'Kubernetes', 'AWS', 'PostgreSQL'],
        framework_library: ['Gin', 'Express.js', 'FastAPI'],
        metodologi: ['Agile', 'Scrum', 'DevOps']
      },
      pengalaman_kerja: {
        total_tahun_pengalaman: 5,
        posisi_terakhir: 'Senior Software Engineer',
        perusahaan_terakhir: 'Gojek',
        industri_pengalaman: ['Technology', 'Fintech'],
        pencapaian_utama: [
          'Led team of 5 developers',
          'Improved system performance by 40%',
          'Implemented microservices architecture'
        ]
      },
      pendidikan: {
        tingkat_pendidikan_tertinggi: 'S1',
        jurusan: 'Teknik Informatika',
        institusi: 'Universitas Indonesia',
        tahun_lulus: 2018,
        ipk: 3.7
      }
    }
    
    // Test auto-fill functionality
    const autoFillResult = autoFillJobSearchParams(sampleCVAnalysis)
    const validation = validateAutoFilledParams(autoFillResult)
    
    return NextResponse.json({
      success: true,
      message: 'Auto-fill test completed successfully',
      test_data: {
        input_cv_analysis: {
          nama: sampleCVAnalysis.informasi_pribadi.nama_lengkap,
          lokasi: sampleCVAnalysis.informasi_pribadi.lokasi,
          tingkat_pengalaman: sampleCVAnalysis.ringkasan_analisis.tingkat_pengalaman,
          estimasi_gaji: sampleCVAnalysis.ringkasan_analisis.estimasi_gaji_bulanan_rupiah,
          potensi_posisi: sampleCVAnalysis.ringkasan_analisis.potensi_kecocokan_posisi
        },
        auto_fill_result: {
          keywords: autoFillResult.keywords,
          location: autoFillResult.location,
          salary_range: {
            min: autoFillResult.salaryRange.min,
            max: autoFillResult.salaryRange.max,
            formatted: `Rp ${autoFillResult.salaryRange.min.toLocaleString()} - Rp ${autoFillResult.salaryRange.max.toLocaleString()}`
          },
          experience_level: autoFillResult.experienceLevel,
          is_auto_filled: autoFillResult.isAutoFilled,
          auto_filled_fields: autoFillResult.autoFilledFields,
          source: autoFillResult.source
        },
        validation: {
          is_valid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings
        }
      },
      performance_metrics: {
        auto_fill_coverage: `${autoFillResult.autoFilledFields.length}/4 fields (${Math.round((autoFillResult.autoFilledFields.length / 4) * 100)}%)`,
        data_source: autoFillResult.source,
        validation_status: validation.isValid ? 'PASSED' : 'FAILED'
      }
    })
    
  } catch (error) {
    console.error('Auto-fill test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Auto-fill test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cv_analysis, test_scenarios } = body
    
    console.log('=== Custom Auto-Fill Test ===')
    
    let results: any[] = []
    
    if (test_scenarios && Array.isArray(test_scenarios)) {
      // Test multiple scenarios
      for (const scenario of test_scenarios) {
        const autoFillResult = autoFillJobSearchParams(scenario.cv_analysis)
        const validation = validateAutoFilledParams(autoFillResult)
        
        results.push({
          scenario_name: scenario.name || 'Unnamed Scenario',
          auto_fill_result: autoFillResult,
          validation: validation,
          coverage: `${autoFillResult.autoFilledFields.length}/4 fields`
        })
      }
    } else if (cv_analysis) {
      // Test single CV analysis
      const autoFillResult = autoFillJobSearchParams(cv_analysis)
      const validation = validateAutoFilledParams(autoFillResult)
      
      results.push({
        scenario_name: 'Custom CV Analysis',
        auto_fill_result: autoFillResult,
        validation: validation,
        coverage: `${autoFillResult.autoFilledFields.length}/4 fields`
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'cv_analysis or test_scenarios required' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Auto-fill test completed for ${results.length} scenario(s)`,
      results,
      summary: {
        total_scenarios: results.length,
        successful_auto_fills: results.filter(r => r.auto_fill_result.isAutoFilled).length,
        validation_passed: results.filter(r => r.validation.is_valid).length
      }
    })
    
  } catch (error) {
    console.error('Custom auto-fill test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Custom auto-fill test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Test edge cases dan scenarios khusus
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { test_type } = body
    
    console.log('=== Auto-Fill Edge Case Testing ===')
    console.log('Test type:', test_type)
    
    let testResults: any = {}
    
    switch (test_type) {
      case 'empty_cv':
        // Test dengan CV kosong
        const emptyResult = autoFillJobSearchParams(undefined)
        testResults = {
          test_name: 'Empty CV Analysis',
          result: emptyResult,
          expected: 'Should use default values',
          passed: !emptyResult.isAutoFilled && emptyResult.source === 'default'
        }
        break
        
      case 'partial_cv':
        // Test dengan CV yang hanya memiliki sebagian data
        const partialCV: Partial<CVAnalysis> = {
          informasi_pribadi: {
            nama_lengkap: 'Jane Doe',
            email: null,
            nomor_telepon: null,
            lokasi: 'Bandung',
            url_linkedin: null,
            url_portfolio_github: null
          },
          ringkasan_analisis: {
            profil_singkat_kandidat: 'Fresh graduate',
            tingkat_pengalaman: 'Fresh Graduate',
            justifikasi_tingkat_pengalaman: 'Baru lulus kuliah',
            estimasi_gaji_bulanan_rupiah: {
              rentang_bawah: null,
              rentang_atas: null,
              justifikasi_estimasi: 'Tidak ada data gaji'
            },
            potensi_kecocokan_posisi: ['Junior Developer'],
            catatan_untuk_perekrut: 'Fresh graduate dengan potensi'
          }
        } as CVAnalysis
        
        const partialResult = autoFillJobSearchParams(partialCV)
        testResults = {
          test_name: 'Partial CV Data',
          result: partialResult,
          expected: 'Should use mix of CV data and defaults',
          passed: partialResult.source === 'mixed' || partialResult.source === 'experience_level'
        }
        break
        
      case 'validation_errors':
        // Test validation dengan data yang invalid
        const invalidResult = {
          keywords: [], // Empty keywords should cause error
          location: [],
          salaryRange: { min: 25000000, max: 15000000 }, // Min > Max should cause error
          experienceLevel: 'senior',
          isAutoFilled: true,
          autoFilledFields: ['keywords'],
          source: 'cv_analysis' as const
        }
        
        const validation = validateAutoFilledParams(invalidResult)
        testResults = {
          test_name: 'Validation Errors',
          result: validation,
          expected: 'Should detect validation errors',
          passed: !validation.isValid && validation.errors.length > 0
        }
        break
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid test type' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      message: `Edge case test completed: ${test_type}`,
      test_results: testResults,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Edge case testing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Edge case testing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
