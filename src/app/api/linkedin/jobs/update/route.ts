import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const { jobId, userId, applicationStatus, notes } = await request.json()

    if (!jobId || !userId || !applicationStatus) {
      return NextResponse.json(
        { error: 'Job ID, User ID, and application status are required' },
        { status: 400 }
      )
    }

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabaseAdmin
      .from('linkedin_jobs')
      .select('id, user_id')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Update job application status
    const updateData: any = {
      application_status: applicationStatus,
      updated_at: new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
    }

    const { error: updateError } = await supabaseAdmin
      .from('linkedin_jobs')
      .update(updateData)
      .eq('id', jobId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Job application status updated successfully',
      jobId,
      applicationStatus
    })

  } catch (error) {
    console.error('LinkedIn job update API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const jobId = searchParams.get('jobId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('linkedin_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('scraped_at', { ascending: false })

    if (jobId) {
      query = query.eq('id', jobId)
    }

    const { data: jobs, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || []
    })

  } catch (error) {
    console.error('LinkedIn jobs GET API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const userId = searchParams.get('userId')

    if (!jobId || !userId) {
      return NextResponse.json(
        { error: 'Job ID and User ID are required' },
        { status: 400 }
      )
    }

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabaseAdmin
      .from('linkedin_jobs')
      .select('id')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Delete job
    const { error: deleteError } = await supabaseAdmin
      .from('linkedin_jobs')
      .delete()
      .eq('id', jobId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: 'LinkedIn job deleted successfully',
      jobId
    })

  } catch (error) {
    console.error('LinkedIn job delete API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
