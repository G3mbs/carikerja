import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, type, filters } = await request.json()

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'User ID and export type required' },
        { status: 400 }
      )
    }

    let data: any[] = []
    let filename = ''

    switch (type) {
      case 'job_results':
        data = await exportJobResults(userId, filters)
        filename = `job_results_${new Date().toISOString().split('T')[0]}.xlsx`
        break
      
      case 'job_applications':
        data = await exportJobApplications(userId, filters)
        filename = `job_applications_${new Date().toISOString().split('T')[0]}.xlsx`
        break
      
      case 'market_research':
        data = await exportMarketResearch(userId, filters)
        filename = `market_research_${new Date().toISOString().split('T')[0]}.xlsx`
        break
      
      case 'cv_analysis':
        data = await exportCVAnalysis(userId, filters)
        filename = `cv_analysis_${new Date().toISOString().split('T')[0]}.xlsx`
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        )
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data found to export' },
        { status: 404 }
      )
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length, 15)
    }))
    worksheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Excel export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

async function exportJobResults(userId: string, filters: any) {
  const { data, error } = await supabaseAdmin
    .from('job_results')
    .select(`
      *,
      job_searches (search_params, platforms)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(result => ({
    'Judul Pekerjaan': result.job_data?.title || '',
    'Perusahaan': result.job_data?.company || '',
    'Lokasi': result.job_data?.location || '',
    'Gaji': result.job_data?.salary || '',
    'Platform': result.job_data?.platform || '',
    'URL': result.job_data?.url || '',
    'Tanggal Posting': result.job_data?.postedDate || '',
    'Match Score': result.job_data?.matchScore || '',
    'Tanggal Ditemukan': new Date(result.created_at).toLocaleDateString('id-ID'),
    'Keywords Pencarian': result.job_searches?.search_params?.keywords?.join(', ') || ''
  }))
}

async function exportJobApplications(userId: string, filters: any) {
  const { data, error } = await supabaseAdmin
    .from('job_applications')
    .select(`
      *,
      cvs (original_name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(app => ({
    'URL Pekerjaan': app.job_url,
    'Status': app.status,
    'CV Digunakan': app.cvs?.original_name || '',
    'Nama Pelamar': app.cv_data?.nama || '',
    'Email': app.cv_data?.email || '',
    'Tanggal Aplikasi': new Date(app.created_at).toLocaleDateString('id-ID'),
    'Tanggal Update': app.updated_at ? new Date(app.updated_at).toLocaleDateString('id-ID') : '',
    'Error': app.error || ''
  }))
}

async function exportMarketResearch(userId: string, filters: any) {
  const { data, error } = await supabaseAdmin
    .from('market_research')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(research => ({
    'Posisi': research.position,
    'Industri': research.industry,
    'Lokasi': research.location,
    'Tanggal Riset': new Date(research.created_at).toLocaleDateString('id-ID'),
    'Gaji Fresh Graduate (Min)': research.research_data?.benchmark_gaji?.fresh_graduate?.min || '',
    'Gaji Fresh Graduate (Max)': research.research_data?.benchmark_gaji?.fresh_graduate?.max || '',
    'Gaji Junior (Min)': research.research_data?.benchmark_gaji?.junior?.min || '',
    'Gaji Junior (Max)': research.research_data?.benchmark_gaji?.junior?.max || '',
    'Gaji Senior (Min)': research.research_data?.benchmark_gaji?.senior?.min || '',
    'Gaji Senior (Max)': research.research_data?.benchmark_gaji?.senior?.max || '',
    'Top Employers': research.research_data?.ekosistem_perusahaan?.top_employers?.join(', ') || '',
    'Skills Prioritas': research.research_data?.kebutuhan_skill?.hard_skills_prioritas?.join(', ') || '',
    'Tren Industri': research.research_data?.analisis_industri?.tren_pertumbuhan || ''
  }))
}

async function exportCVAnalysis(userId: string, filters: any) {
  const { data, error } = await supabaseAdmin
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })

  if (error) throw error

  return data.map(cv => ({
    'Nama File': cv.original_name,
    'Tanggal Upload': new Date(cv.uploaded_at).toLocaleDateString('id-ID'),
    'Nama': cv.analysis?.informasi_pribadi?.nama_lengkap || '',
    'Email': cv.analysis?.informasi_pribadi?.email || '',
    'Lokasi': cv.analysis?.informasi_pribadi?.lokasi || '',
    'Tingkat Pengalaman': cv.analysis?.ringkasan_analisis?.tingkat_pengalaman || '',
    'Profil Singkat': cv.analysis?.ringkasan_analisis?.profil_singkat_kandidat || '',
    'Estimasi Gaji': cv.analysis?.ringkasan_analisis?.estimasi_gaji_bulanan_rupiah ?
      `Rp ${cv.analysis.ringkasan_analisis.estimasi_gaji_bulanan_rupiah.rentang_bawah?.toLocaleString('id-ID')} - Rp ${cv.analysis.ringkasan_analisis.estimasi_gaji_bulanan_rupiah.rentang_atas?.toLocaleString('id-ID')}` : '',
    'Keahlian Teknis': cv.analysis?.keahlian?.keahlian_teknis?.join(', ') || '',
    'Tools & Platform': cv.analysis?.keahlian?.tools_platform?.join(', ') || '',
    'Potensi Posisi': cv.analysis?.ringkasan_analisis?.potensi_kecocokan_posisi?.join(', ') || '',
    'Industri Pilihan': cv.analysis?.minat_karir?.industri_pilihan?.join(', ') || '',
    'Rentang Gaji': cv.analysis?.parameter_pencarian_kerja?.rentang_gaji || '',
    'Keywords Rekomendasi': cv.analysis?.parameter_pencarian_kerja?.kata_kunci_rekomendasi?.join(', ') || ''
  }))
}
