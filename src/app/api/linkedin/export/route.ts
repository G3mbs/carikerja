import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsEnhanced } from '@/lib/google-sheets-enhanced'
import { supabaseAdmin } from '@/lib/supabase'
import { LinkedInJobData } from '@/types/linkedin'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, exportConfig } = await request.json()

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

    // Get jobs for this session
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('linkedin_jobs')
      .select('*')
      .eq('scraping_session_id', sessionId)
      .order('scraped_at', { ascending: false })

    if (jobsError) {
      throw jobsError
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { error: 'No jobs found for this session' },
        { status: 404 }
      )
    }

    // Convert database jobs to LinkedIn job format
    const linkedInJobs: LinkedInJobData[] = jobs.map(job => ({
      id: job.id,
      linkedinUrl: job.linkedin_url,
      companyLogoUrl: job.company_logo_url,
      jobTitleShort: job.job_title_short,
      insightStatus: job.insight_status,
      applicationStatus: job.application_status,
      easyApply: job.easy_apply,
      additionalInsights: job.additional_insights || [],
      jobTitle: job.job_title,
      companyName: job.company_name,
      location: job.location,
      salaryRange: job.salary_range,
      postedTime: job.posted_time,
      matchScore: job.match_score,
      scrapingSessionId: job.scraping_session_id,
      scrapedAt: job.scraped_at
    }))

    // Get user email for sharing
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    // Initialize Google Sheets service
    const googleSheets = new GoogleSheetsEnhanced()

    // Validate Google Sheets configuration
    const validation = googleSheets.validateConfiguration()
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Google Sheets not configured properly',
          details: validation.errors
        },
        { status: 500 }
      )
    }

    // Default export configuration
    const config = {
      spreadsheetName: `LinkedIn Jobs - ${new Date().toLocaleDateString()}`,
      worksheetName: 'LinkedIn Jobs',
      includeHeaders: true,
      autoFormat: true,
      shareWithUser: user?.email,
      ...exportConfig
    }

    // Create and export to Google Sheets
    const { spreadsheetId, url } = await googleSheets.createLinkedInJobSpreadsheet(config, userId)
    await googleSheets.exportLinkedInJobs(spreadsheetId, linkedInJobs, config)

    // Update session with Google Sheets URL
    const { error: updateError } = await supabaseAdmin
      .from('linkedin_scraping_sessions')
      .update({
        google_sheets_url: url,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session with Google Sheets URL:', updateError)
    }

    return NextResponse.json({
      success: true,
      spreadsheetId,
      url,
      jobsExported: linkedInJobs.length,
      message: 'Jobs exported to Google Sheets successfully'
    })

  } catch (error) {
    console.error('LinkedIn export API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')
    const format = searchParams.get('format') || 'json'

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

    // Get jobs for this session
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('linkedin_jobs')
      .select('*')
      .eq('scraping_session_id', sessionId)
      .order('scraped_at', { ascending: false })

    if (jobsError) {
      throw jobsError
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { error: 'No jobs found for this session' },
        { status: 404 }
      )
    }

    // Return different formats based on request
    switch (format.toLowerCase()) {
      case 'csv':
        const csvData = convertJobsToCSV(jobs)
        return new Response(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="linkedin-jobs-${sessionId}.csv"`
          }
        })

      case 'excel':
        // For Excel export, return JSON with instructions
        return NextResponse.json({
          success: true,
          message: 'Use POST /api/linkedin/export for Excel/Google Sheets export',
          jobsCount: jobs.length,
          availableFormats: ['json', 'csv', 'google-sheets']
        })

      case 'json':
      default:
        return NextResponse.json({
          success: true,
          session: {
            id: session.id,
            status: session.status,
            totalJobsFound: session.total_jobs_found,
            googleSheetsUrl: session.google_sheets_url,
            createdAt: session.created_at,
            completedAt: session.completed_at
          },
          jobs: jobs.map(job => ({
            id: job.id,
            jobTitle: job.job_title,
            companyName: job.company_name,
            location: job.location,
            salaryRange: job.salary_range,
            postedTime: job.posted_time,
            linkedinUrl: job.linkedin_url,
            easyApply: job.easy_apply,
            applicationStatus: job.application_status,
            matchScore: job.match_score,
            additionalInsights: job.additional_insights,
            scrapedAt: job.scraped_at
          })),
          exportOptions: {
            totalJobs: jobs.length,
            formats: ['json', 'csv', 'google-sheets'],
            googleSheetsUrl: session.google_sheets_url
          }
        })
    }

  } catch (error) {
    console.error('LinkedIn export GET API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}

function convertJobsToCSV(jobs: any[]): string {
  if (jobs.length === 0) return ''

  // CSV headers
  const headers = [
    'Job Title',
    'Company',
    'Location',
    'Salary Range',
    'Posted Time',
    'LinkedIn URL',
    'Easy Apply',
    'Application Status',
    'Match Score',
    'Additional Insights',
    'Scraped Date'
  ]

  // Convert jobs to CSV rows
  const rows = jobs.map(job => [
    `"${job.job_title || ''}"`,
    `"${job.company_name || ''}"`,
    `"${job.location || ''}"`,
    `"${job.salary_range || ''}"`,
    `"${job.posted_time || ''}"`,
    `"${job.linkedin_url || ''}"`,
    job.easy_apply ? 'Yes' : 'No',
    `"${job.application_status || 'Not Applied'}"`,
    job.match_score || '',
    `"${(job.additional_insights || []).join(', ')}"`,
    `"${new Date(job.scraped_at).toLocaleDateString()}"`
  ])

  // Combine headers and rows
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
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
      .select('google_sheets_url')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Clear Google Sheets URL from session
    const { error: updateError } = await supabaseAdmin
      .from('linkedin_scraping_sessions')
      .update({
        google_sheets_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Google Sheets link removed from session',
      previousUrl: session.google_sheets_url
    })

  } catch (error) {
    console.error('LinkedIn export DELETE API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove export link' },
      { status: 500 }
    )
  }
}
