import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { JobSearchParams } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { name, searchParams, frequency, userId } = await request.json()

    if (!name || !searchParams || !userId) {
      return NextResponse.json(
        { error: 'Name, search parameters, and user ID required' },
        { status: 400 }
      )
    }

    // Validate search parameters
    const validatedParams: JobSearchParams = {
      keywords: searchParams.keywords || [],
      location: searchParams.location || ['Indonesia'],
      salaryRange: {
        min: searchParams.salaryRange?.min || 0,
        max: searchParams.salaryRange?.max || 50000000
      },
      experienceLevel: searchParams.experienceLevel || 'any',
      companyType: searchParams.companyType || [],
      industry: searchParams.industry || []
    }

    // Create job alert
    const { data: alert, error } = await supabaseAdmin
      .from('job_alerts')
      .insert({
        user_id: userId,
        name: name,
        search_params: validatedParams,
        frequency: frequency || 'daily',
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create job alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alert: alert
    })

  } catch (error) {
    console.error('Job alert creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create job alert' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get user's job alerts
    const { data: alerts, error } = await supabaseAdmin
      .from('job_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch job alerts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alerts: alerts
    })

  } catch (error) {
    console.error('Job alerts fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { alertId, updates, userId } = await request.json()

    if (!alertId || !userId) {
      return NextResponse.json(
        { error: 'Alert ID and User ID required' },
        { status: 400 }
      )
    }

    // Update job alert
    const { data: alert, error } = await supabaseAdmin
      .from('job_alerts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update job alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alert: alert
    })

  } catch (error) {
    console.error('Job alert update error:', error)
    return NextResponse.json(
      { error: 'Failed to update job alert' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('alertId')
    const userId = searchParams.get('userId')

    if (!alertId || !userId) {
      return NextResponse.json(
        { error: 'Alert ID and User ID required' },
        { status: 400 }
      )
    }

    // Delete job alert
    const { error } = await supabaseAdmin
      .from('job_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete job alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Job alert deleted successfully'
    })

  } catch (error) {
    console.error('Job alert deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete job alert' },
      { status: 500 }
    )
  }
}
