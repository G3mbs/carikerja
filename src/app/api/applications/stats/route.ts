import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ApplicationStats, ApplicationTrend } from '@/types'

// GET /api/applications/stats - Get application statistics for dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get total applications count
    const { count: totalApplications } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get applications by status
    const { data: statusData } = await supabaseAdmin
      .from('job_applications')
      .select('status')
      .eq('user_id', userId)

    const byStatus = {
      wishlist: 0,
      applied: 0,
      assessment: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      hired: 0,
      withdrawn: 0
    }

    statusData?.forEach(app => {
      if (app.status in byStatus) {
        byStatus[app.status as keyof typeof byStatus]++
      }
    })

    // Get recent applications (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: recentApplications } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('application_date', thirtyDaysAgo.toISOString().split('T')[0])

    // Get upcoming interviews
    const today = new Date().toISOString()
    const { count: upcomingInterviews } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('next_interview_date', today)

    // Get pending offers
    const { count: pendingOffers } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'offer')

    // Calculate average response time (from applied to any status change)
    const { data: responseTimeData } = await supabaseAdmin
      .from('job_applications')
      .select('application_date, created_at, updated_at, status')
      .eq('user_id', userId)
      .neq('status', 'wishlist')
      .neq('status', 'applied')

    let totalResponseTime = 0
    let responseCount = 0

    responseTimeData?.forEach(app => {
      const applicationDate = new Date(app.application_date)
      const responseDate = new Date(app.updated_at)
      const diffTime = responseDate.getTime() - applicationDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 0 && diffDays < 365) { // Reasonable range
        totalResponseTime += diffDays
        responseCount++
      }
    })

    const averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0

    // Get application trends (last 30 days)
    const trends: ApplicationTrend[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const { count: applications } = await supabaseAdmin
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('application_date', dateStr)

      const { count: interviews } = await supabaseAdmin
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('next_interview_date', dateStr)

      const { data: offerData } = await supabaseAdmin
        .from('job_applications')
        .select('offer_received_date')
        .eq('user_id', userId)
        .eq('offer_received_date', dateStr)

      trends.push({
        date: dateStr,
        applications: applications || 0,
        interviews: interviews || 0,
        offers: offerData?.length || 0
      })
    }

    const stats: ApplicationStats = {
      total: totalApplications || 0,
      byStatus,
      recentApplications: recentApplications || 0,
      upcomingInterviews: upcomingInterviews || 0,
      pendingOffers: pendingOffers || 0,
      averageResponseTime
    }

    return NextResponse.json({ 
      stats,
      trends
    })

  } catch (error) {
    console.error('Error in GET /api/applications/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/applications/recent-activity - Get recent application activities
export async function POST(request: NextRequest) {
  try {
    const { userId, limit = 10 } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Try to get activities with join, fallback to simple query if join fails
    let activities = []
    let error = null

    try {
      const { data: activitiesData, error: activitiesError } = await supabaseAdmin
        .from('application_activities')
        .select(`
          *,
          job_applications (
            id,
            company_name,
            position_title,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      activities = activitiesData || []
      error = activitiesError
    } catch (joinError) {
      // Fallback to simple query without join
      try {
        const { data: simpleActivities, error: simpleError } = await supabaseAdmin
          .from('application_activities')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)

        activities = simpleActivities || []
        error = simpleError
      } catch (fallbackError) {
        // If application_activities table doesn't exist, return empty array
        activities = []
        error = null
      }
    }

    if (error) {
      console.error('Error fetching recent activities:', error)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    return NextResponse.json({ activities: activities || [] })

  } catch (error) {
    console.error('Error in POST /api/applications/recent-activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
