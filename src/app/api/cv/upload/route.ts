import { NextRequest, NextResponse } from 'next/server'
import { CVParser } from '@/lib/cv-parser'
import { MistralService } from '@/lib/mistral'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured and accessible
    let isSupabaseAvailable = false
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('cvs')
          .select('count')
          .limit(1)
        isSupabaseAvailable = !error
      } catch (error) {
        console.log('Supabase connection test failed:', error)
        isSupabaseAvailable = false
      }
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Validate file
    const parser = new CVParser()
    const validation = parser.validateFile(file)
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Parse CV content
    const cvContent = await parser.parseFile(file)
    const basicInfo = parser.extractBasicInfo(cvContent)

    // Upload file to Supabase Storage
    const fileName = `${userId}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('cv-files')
      .upload(fileName, file)

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Analyze CV with Mistral AI
    const mistralService = new MistralService()
    let analysis = null
    
    try {
      analysis = await mistralService.analyzeCV(cvContent)
    } catch (analysisError) {
      console.error('CV analysis error:', analysisError)
      // Continue without analysis for now
    }

    // Save CV record to database or return offline data
    let cvRecord
    if (isSupabaseAvailable) {
      // Upload file to Supabase Storage
      const fileName = `${userId}/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('cv-files')
        .upload(fileName, file)

      if (uploadError) {
        console.error('File upload error:', uploadError)
        // Continue with offline mode if storage fails
      }

      // Try to save to database
      const { data: dbData, error: dbError } = await supabaseAdmin
        .from('cvs')
        .insert({
          user_id: userId,
          filename: fileName,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          content: cvContent,
          basic_info: basicInfo,
          analysis: analysis,
          uploaded_at: new Date().toISOString(),
          version: 1,
          is_active: true
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        isSupabaseAvailable = false
      } else {
        cvRecord = dbData
      }
    }

    // If Supabase is not available, create offline record
    if (!isSupabaseAvailable) {
      cvRecord = {
        id: `offline_cv_${Date.now()}`,
        user_id: userId,
        filename: `offline_${file.name}`,
        original_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        content: cvContent,
        basic_info: basicInfo,
        analysis: analysis,
        uploaded_at: new Date().toISOString(),
        version: 1,
        is_active: true,
        offline: true
      }
    }

    return NextResponse.json({
      success: true,
      offline: !isSupabaseAvailable,
      cv: {
        id: cvRecord.id,
        filename: cvRecord.filename,
        originalName: cvRecord.original_name,
        fileSize: cvRecord.file_size,
        mimeType: cvRecord.mime_type,
        uploadedAt: cvRecord.uploaded_at,
        analysis: cvRecord.analysis,
        basicInfo: cvRecord.basic_info,
        offline: cvRecord.offline || false
      }
    })

  } catch (error) {
    console.error('CV upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured. Please set up Supabase environment variables.' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get user's CVs
    const { data: cvs, error } = await supabaseAdmin
      .from('cvs')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch CVs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cvs: cvs.map(cv => ({
        id: cv.id,
        filename: cv.filename,
        originalName: cv.original_name,
        fileSize: cv.file_size,
        mimeType: cv.mime_type,
        uploadedAt: cv.uploaded_at,
        analysis: cv.analysis,
        basicInfo: cv.basic_info,
        version: cv.version,
        isActive: cv.is_active
      }))
    })

  } catch (error) {
    console.error('CV fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
