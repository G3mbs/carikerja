import { NextRequest, NextResponse } from 'next/server'
import { LinkedInScraper } from '@/lib/linkedin-scraper'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
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

    // Handle temporary sessions (created in frontend before database)
    if (sessionId.startsWith('temp_')) {
      return NextResponse.json({
        success: true,
        session: {
          id: sessionId,
          status: 'pending',
          progress: {
            currentPage: 0,
            totalPages: 0,
            jobsFound: 0,
            jobsProcessed: 0,
            status: 'initializing',
            message: 'Initializing LinkedIn scraping...',
            startTime: new Date().toISOString(),
            errors: [],
            progressPercentage: 0
          },
          totalJobsFound: 0,
          googleSheetsUrl: null,
          errorMessage: null,
          createdAt: new Date().toISOString(),
          startedAt: null,
          completedAt: null,
          updatedAt: new Date().toISOString()
        }
      })
    }

    try {
      // Get session status from database
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

      // Get job count for this session
      const { count: jobCount, error: countError } = await supabaseAdmin
        .from('linkedin_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('scraping_session_id', sessionId)

      if (countError) {
        console.error('Error counting jobs:', countError)
      }

      // Calculate progress percentage
      let progressPercentage = 0
      if (session.progress && session.progress.totalPages > 0) {
        progressPercentage = Math.round(
          (session.progress.currentPage / session.progress.totalPages) * 100
        )
      }

      // Estimate time remaining
      let estimatedTimeRemaining: number | undefined
      if (session.progress && session.status === 'running') {
        const startTime = new Date(session.progress.startTime).getTime()
        const currentTime = Date.now()
        const elapsedTime = currentTime - startTime

        if (session.progress.currentPage > 0 && session.progress.totalPages > 0) {
          const timePerPage = elapsedTime / session.progress.currentPage
          const remainingPages = session.progress.totalPages - session.progress.currentPage
          estimatedTimeRemaining = Math.round(timePerPage * remainingPages / 1000) // in seconds
        }
      }

      return NextResponse.json({
        success: true,
        session: {
          id: session.id,
          status: session.status,
          progress: {
            ...session.progress,
            progressPercentage,
            estimatedTimeRemaining
          },
          totalJobsFound: session.total_jobs_found || jobCount || 0,
          googleSheetsUrl: session.google_sheets_url,
          errorMessage: session.error_message,
          createdAt: session.created_at,
          startedAt: session.started_at,
          completedAt: session.completed_at,
          updatedAt: session.updated_at
        }
      })

    } catch (dbError: any) {
      // Handle case where database tables don't exist
      if (dbError.code === '42P01') {
        return NextResponse.json({
          success: true,
          session: {
            id: sessionId,
            status: 'pending',
            progress: {
              currentPage: 0,
              totalPages: 0,
              jobsFound: 0,
              jobsProcessed: 0,
              status: 'waiting',
              message: 'Database tables not found. Please run database migration.',
              startTime: new Date().toISOString(),
              errors: ['Database tables not found'],
              progressPercentage: 0
            },
            totalJobsFound: 0,
            googleSheetsUrl: null,
            errorMessage: 'Database setup required',
            createdAt: new Date().toISOString(),
            startedAt: null,
            completedAt: null,
            updatedAt: new Date().toISOString()
          }
        })
      }
      throw dbError
    }

  } catch (error) {
    console.error('LinkedIn status API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, progress } = await request.json()

    if (!sessionId || !userId || !progress) {
      return NextResponse.json(
        { error: 'Session ID, User ID, and progress data are required' },
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

    // Update session progress
    const { error: updateError } = await supabaseAdmin
      .from('linkedin_scraping_sessions')
      .update({
        progress,
        status: progress.status === 'completed' ? 'completed' : 'running',
        updated_at: new Date().toISOString(),
        ...(progress.status === 'completed' && {
          completed_at: new Date().toISOString(),
          total_jobs_found: progress.jobsFound
        })
      })
      .eq('id', sessionId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully'
    })

  } catch (error) {
    console.error('LinkedIn status update API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const olderThan = searchParams.get('olderThan') // days

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const daysOld = parseInt(olderThan || '30')
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Get sessions to delete
    const { data: sessionsToDelete, error: fetchError } = await supabaseAdmin
      .from('linkedin_scraping_sessions')
      .select('id')
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString())

    if (fetchError) {
      throw fetchError
    }

    if (!sessionsToDelete || sessionsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old sessions to delete',
        deletedCount: 0
      })
    }

    const sessionIds = sessionsToDelete.map(s => s.id)

    // Delete associated jobs first
    const { error: jobsError } = await supabaseAdmin
      .from('linkedin_jobs')
      .delete()
      .in('scraping_session_id', sessionIds)

    if (jobsError) {
      console.error('Error deleting old LinkedIn jobs:', jobsError)
    }

    // Delete sessions
    const { error: sessionsError } = await supabaseAdmin
      .from('linkedin_scraping_sessions')
      .delete()
      .in('id', sessionIds)

    if (sessionsError) {
      throw sessionsError
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${sessionIds.length} old LinkedIn scraping sessions`,
      deletedCount: sessionIds.length
    })

  } catch (error) {
    console.error('LinkedIn status cleanup API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// WebSocket-like endpoint for real-time updates (using Server-Sent Events)
export async function PUT(request: NextRequest) {
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

    // Set up Server-Sent Events
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial status
        const initialData = JSON.stringify({
          type: 'status',
          data: session
        })
        controller.enqueue(encoder.encode(`data: ${initialData}\n\n`))

        // Set up polling for updates
        const interval = setInterval(async () => {
          try {
            const { data: updatedSession } = await supabaseAdmin
              .from('linkedin_scraping_sessions')
              .select('*')
              .eq('id', sessionId)
              .single()

            if (updatedSession) {
              const updateData = JSON.stringify({
                type: 'update',
                data: updatedSession
              })
              controller.enqueue(encoder.encode(`data: ${updateData}\n\n`))

              // Close stream if session is completed or failed
              if (['completed', 'failed'].includes(updatedSession.status)) {
                clearInterval(interval)
                controller.close()
              }
            }
          } catch (error) {
            console.error('Error in SSE update:', error)
            clearInterval(interval)
            controller.close()
          }
        }, 2000) // Update every 2 seconds

        // Clean up on close
        setTimeout(() => {
          clearInterval(interval)
          controller.close()
        }, 300000) // Close after 5 minutes max
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('LinkedIn status SSE API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
