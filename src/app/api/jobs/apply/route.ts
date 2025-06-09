import { NextRequest, NextResponse } from 'next/server'
import { BrowserUseService } from '@/lib/browser-use'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { jobUrl, cvId, userId } = await request.json()

    if (!jobUrl || !cvId || !userId) {
      return NextResponse.json(
        { error: 'Job URL, CV ID, and User ID required' },
        { status: 400 }
      )
    }

    // Get CV data
    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .eq('user_id', userId)
      .single()

    if (cvError || !cv) {
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      )
    }

    // Prepare CV data for application
    const cvData = {
      nama: cv.basic_info?.name || cv.analysis?.informasi_pribadi?.nama || 'Tidak tersedia',
      email: cv.basic_info?.email || cv.analysis?.informasi_pribadi?.email || 'Tidak tersedia',
      telepon: cv.basic_info?.phone || 'Tidak tersedia',
      lokasi: cv.analysis?.informasi_pribadi?.lokasi || 'Indonesia'
    }

    // Create browser automation task for job application
    const browserService = new BrowserUseService()
    const task = await browserService.createJobApplicationTask(jobUrl, cvData)

    // Save application task to database
    const { data: applicationRecord, error: dbError } = await supabaseAdmin
      .from('job_applications')
      .insert({
        user_id: userId,
        cv_id: cvId,
        job_url: jobUrl,
        task_id: task.id,
        status: 'pending',
        cv_data: cvData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save application task' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      applicationId: applicationRecord.id,
      status: task.status
    })

  } catch (error) {
    console.error('Job application error:', error)
    return NextResponse.json(
      { error: 'Failed to start job application' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const taskId = searchParams.get('taskId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    if (taskId) {
      // Get specific application task status
      const browserService = new BrowserUseService()
      const task = await browserService.getTaskStatus(taskId)
      
      // Update application status in database
      await supabaseAdmin
        .from('job_applications')
        .update({
          status: task.status,
          results: task.results,
          error: task.error,
          updated_at: new Date().toISOString()
        })
        .eq('task_id', taskId)

      return NextResponse.json({
        success: true,
        task: task
      })
    } else {
      // Get user's application history
      const { data: applications, error } = await supabaseAdmin
        .from('job_applications')
        .select(`
          *,
          cvs (original_name, analysis)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch application history' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        applications: applications
      })
    }

  } catch (error) {
    console.error('Job application fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
