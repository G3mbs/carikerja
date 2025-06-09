import { NextRequest, NextResponse } from 'next/server'
import { LinkedInScraper } from '@/lib/linkedin-scraper'
import { CVToLinkedInConverter } from '@/lib/cv-to-linkedin-params'
import { supabaseAdmin } from '@/lib/supabase'
import { LinkedInSearchParams } from '@/types/linkedin'

export async function POST(request: NextRequest) {
  try {
    const { searchParams, userId, cvAnalysis, exportToSheets = true } = await request.json()

    if (!searchParams || !userId) {
      return NextResponse.json(
        { error: 'Search parameters and user ID are required' },
        { status: 400 }
      )
    }

    // Check if LinkedIn tables exist first
    try {
      const { data: testQuery } = await supabaseAdmin
        .from('linkedin_scraping_sessions')
        .select('id')
        .limit(1)
    } catch (dbError: any) {
      if (dbError.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: 'LinkedIn tables not found. Please run database migration first.',
          requiresSetup: true
        }, { status: 503 })
      }
    }

    // Validate user exists (skip for demo users)
    if (!userId.startsWith('demo-user')) {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    // Convert search parameters if coming from CV analysis
    let linkedInParams: LinkedInSearchParams
    if (cvAnalysis) {
      linkedInParams = CVToLinkedInConverter.convertCVToLinkedInParams(cvAnalysis)

      // Override with any custom parameters provided
      linkedInParams = {
        ...linkedInParams,
        ...searchParams
      }
    } else {
      linkedInParams = searchParams
    }

    // Validate LinkedIn parameters
    const validation = CVToLinkedInConverter.validateLinkedInParams(linkedInParams)
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid search parameters: ${validation.errors.join(', ')}` },
        { status: 400 }
      )
    }

    // Initialize LinkedIn scraper
    const scraper = new LinkedInScraper({
      maxPages: 5, // Limit for demo
      exportToSheets
    })

    // Start scraping (async operation)
    console.log('Starting LinkedIn scraping for user:', userId)
    console.log('Search parameters:', linkedInParams)

    // Start scraping in background
    scraper.scrapeJobs(linkedInParams, userId)
      .then(result => {
        console.log('LinkedIn scraping completed:', result.success ? 'success' : 'failed')
      })
      .catch(error => {
        console.error('LinkedIn scraping error:', error.message)
      })

    return NextResponse.json({
      success: true,
      message: 'LinkedIn scraping started',
      searchParams: linkedInParams,
      userId,
      cvAnalysis: cvAnalysis ? 'provided' : 'none'
    })

  } catch (error) {
    console.error('LinkedIn scrape API error:', error)
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
    const sessionId = searchParams.get('sessionId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if LinkedIn tables exist
    try {
      // Get user's LinkedIn scraping sessions
      let query = supabaseAdmin
        .from('linkedin_scraping_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (sessionId) {
        query = query.eq('id', sessionId)
      }

      const { data: sessions, error } = await query

      if (error) {
        throw error
      }

      // If specific session requested, also get jobs
      if (sessionId && sessions.length > 0) {
        const { data: jobs, error: jobsError } = await supabaseAdmin
          .from('linkedin_jobs')
          .select('*')
          .eq('scraping_session_id', sessionId)
          .order('scraped_at', { ascending: false })

        if (jobsError) {
          console.error('Error fetching LinkedIn jobs:', jobsError)
        }

        return NextResponse.json({
          success: true,
          session: sessions[0],
          jobs: jobs || []
        })
      }

      return NextResponse.json({
        success: true,
        sessions
      })

    } catch (dbError: any) {
      // If tables don't exist, return empty data
      if (dbError.code === '42P01') {
        console.log('LinkedIn tables not found, returning empty data')
        return NextResponse.json({
          success: true,
          sessions: [],
          message: 'LinkedIn tables not yet created. Please run database migration.'
        })
      }
      throw dbError
    }

  } catch (error) {
    console.error('LinkedIn scrape GET API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      )
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('linkedin_scraping_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Delete associated jobs first
    const { error: jobsError } = await supabaseAdmin
      .from('linkedin_jobs')
      .delete()
      .eq('scraping_session_id', sessionId)

    if (jobsError) {
      console.error('Error deleting LinkedIn jobs:', jobsError)
    }

    // Delete session
    const { error: deleteError } = await supabaseAdmin
      .from('linkedin_scraping_sessions')
      .delete()
      .eq('id', sessionId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: 'LinkedIn scraping session deleted'
    })

  } catch (error) {
    console.error('LinkedIn scrape DELETE API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, userId, action } = await request.json()

    if (!sessionId || !userId || !action) {
      return NextResponse.json(
        { error: 'Session ID, User ID, and action are required' },
        { status: 400 }
      )
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('linkedin_scraping_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'pause':
        if (session.status === 'running') {
          updateData.status = 'paused'
        } else {
          return NextResponse.json(
            { error: 'Can only pause running sessions' },
            { status: 400 }
          )
        }
        break

      case 'resume':
        if (session.status === 'paused') {
          updateData.status = 'running'
        } else {
          return NextResponse.json(
            { error: 'Can only resume paused sessions' },
            { status: 400 }
          )
        }
        break

      case 'cancel':
        if (['pending', 'running', 'paused'].includes(session.status)) {
          updateData.status = 'failed'
          updateData.error_message = 'Cancelled by user'
        } else {
          return NextResponse.json(
            { error: 'Cannot cancel completed or failed sessions' },
            { status: 400 }
          )
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: pause, resume, or cancel' },
          { status: 400 }
        )
    }

    // Update session
    const { error: updateError } = await supabaseAdmin
      .from('linkedin_scraping_sessions')
      .update(updateData)
      .eq('id', sessionId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: `Session ${action}ed successfully`,
      action
    })

  } catch (error) {
    console.error('LinkedIn scrape PATCH API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
