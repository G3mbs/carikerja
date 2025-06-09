import { NextRequest, NextResponse } from 'next/server'
import { BrowserUseService } from '@/lib/browser-use'
import { supabaseAdmin } from '@/lib/supabase'
import { JobSearchParams } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { searchParams, platforms, userId, requestId } = await request.json()
    const requestIdHeader = request.headers.get('X-Request-ID')
    const finalRequestId = requestId || requestIdHeader || `req_${Date.now()}`

    console.log('=== JOB SEARCH REQUEST START ===')
    console.log('Request ID:', finalRequestId)
    console.log('User ID:', userId)
    console.log('Platforms:', platforms)
    console.log('Search Parameters:', JSON.stringify(searchParams, null, 2))

    if (!searchParams || !platforms || !userId) {
      console.error('Missing required parameters')
      return NextResponse.json(
        { error: 'Search parameters, platforms, and user ID required' },
        { status: 400 }
      )
    }

    // Check for recent duplicate requests (within last 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
    const { data: recentSearches } = await supabaseAdmin
      .from('job_searches')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtySecondsAgo)
      .order('created_at', { ascending: false })

    if (recentSearches && recentSearches.length > 0) {
      const lastSearch = recentSearches[0]
      const lastParams = JSON.stringify(lastSearch.search_params)
      const currentParams = JSON.stringify(searchParams)

      if (lastParams === currentParams && JSON.stringify(lastSearch.platforms) === JSON.stringify(platforms)) {
        console.log('Duplicate request detected, returning existing task:', lastSearch.task_id)
        return NextResponse.json({
          success: true,
          taskId: lastSearch.task_id,
          searchId: lastSearch.id,
          status: 'pending',
          message: 'Using existing search task'
        })
      }
    }

    // Validate search parameters
    const jobSearchParams: JobSearchParams = {
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

    console.log('Validated parameters:', JSON.stringify(jobSearchParams, null, 2))

    // Create browser automation task
    const browserService = new BrowserUseService()
    console.log('Creating browser task...')
    const task = await browserService.createJobSearchTask(jobSearchParams, platforms)
    console.log('Browser task created:', task.id)

    // Save search task to database
    const insertData: any = {
      user_id: userId,
      task_id: task.id,
      search_params: jobSearchParams,
      platforms: platforms,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    // Only add request_id if the column exists (for backward compatibility)
    try {
      insertData.request_id = finalRequestId
    } catch (e) {
      console.log('request_id column not available, skipping...')
    }

    const { data: searchRecord, error: dbError } = await supabaseAdmin
      .from('job_searches')
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save search task' },
        { status: 500 }
      )
    }

    console.log('Search record saved:', searchRecord.id)
    console.log('=== JOB SEARCH REQUEST END ===')

    return NextResponse.json({
      success: true,
      taskId: task.id,
      searchId: searchRecord.id,
      status: task.status,
      requestId: finalRequestId
    })

  } catch (error) {
    console.error('Job search error:', error)
    return NextResponse.json(
      { error: 'Failed to start job search' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const taskId = searchParams.get('taskId')
    const debug = searchParams.get('debug') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    if (taskId) {
      // Get specific task status and results
      console.log('Fetching task status for:', taskId)
      const browserService = new BrowserUseService()
      const task = await browserService.getTaskStatus(taskId)
      console.log('Task status:', task.status)

      let results = []
      if (task.status === 'completed') {
        console.log('Task completed, fetching results...')
        results = await browserService.getTaskResults(taskId)
        console.log('Found results:', results.length)

        // Save results to database
        if (results.length > 0) {
          await supabaseAdmin
            .from('job_results')
            .upsert(
              results.map(job => ({
                task_id: taskId,
                user_id: userId,
                job_data: job,
                created_at: new Date().toISOString()
              })),
              { onConflict: 'task_id,job_data->id' }
            )
        }
      }

      return NextResponse.json({
        success: true,
        task: task,
        results: results
      })
    } else {
      // Get user's search history
      const limit = debug ? 50 : 20
      const { data: searches, error } = await supabaseAdmin
        .from('job_searches')
        .select(`
          *,
          job_results (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch search history' },
          { status: 500 }
        )
      }

      if (debug) {
        console.log(`Returning ${searches?.length || 0} search tasks for debug`)
      }

      return NextResponse.json({
        success: true,
        tasks: searches || []
      })
    }

  } catch (error) {
    console.error('Job search fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
