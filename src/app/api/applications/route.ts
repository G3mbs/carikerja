import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ApplicationFilters, ApplicationSortOptions } from '@/types'

// GET /api/applications - Get user's job applications with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Build query with filters
    let query = supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        cvs:cv_id (
          id,
          filename,
          original_name
        )
      `)
      .eq('user_id', userId)

    // Apply filters
    const status = searchParams.get('status')
    if (status) {
      const statusArray = status.split(',')
      query = query.in('status', statusArray)
    }

    const companyName = searchParams.get('companyName')
    if (companyName) {
      query = query.ilike('company_name', `%${companyName}%`)
    }

    const positionTitle = searchParams.get('positionTitle')
    if (positionTitle) {
      query = query.ilike('position_title', `%${positionTitle}%`)
    }

    const location = searchParams.get('location')
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) {
      query = query.gte('application_date', dateFrom)
    }

    const dateTo = searchParams.get('dateTo')
    if (dateTo) {
      query = query.lte('application_date', dateTo)
    }

    const salaryMin = searchParams.get('salaryMin')
    if (salaryMin) {
      query = query.gte('salary_offered', parseInt(salaryMin))
    }

    const salaryMax = searchParams.get('salaryMax')
    if (salaryMax) {
      query = query.lte('salary_offered', parseInt(salaryMax))
    }

    // Apply sorting - map frontend field names to database field names
    const sortFieldMap: Record<string, string> = {
      'applicationDate': 'application_date',
      'companyName': 'company_name',
      'positionTitle': 'position_title',
      'salaryOffered': 'salary_offered'
    }

    const frontendSortField = searchParams.get('sortField') || 'applicationDate'
    const dbSortField = sortFieldMap[frontendSortField] || frontendSortField
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(dbSortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: applications, error, count } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return NextResponse.json({
      applications: applications || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/applications - Create new job application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      cvId,
      companyName,
      positionTitle,
      jobUrl,
      applicationDate,
      status = 'wishlist',
      location,
      salaryOffered,
      salaryCurrency = 'IDR',
      employmentType,
      workArrangement,
      hrContact,
      hrEmail,
      hrPhone,
      applicationMethod,
      referralSource,
      notes,
      coverLetterUsed
    } = body

    if (!userId || !companyName || !positionTitle) {
      return NextResponse.json({ 
        error: 'User ID, company name, and position title are required' 
      }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Insert new application - try with the original table structure first
    let insertData: any = {
      user_id: userId,
      status,
      cv_data: null,
      results: null,
      error: null
    }

    // Check if we have the enhanced table structure or original structure
    // Try with enhanced structure first
    try {
      insertData = {
        user_id: userId,
        cv_id: cvId || null,
        company_name: companyName,
        position_title: positionTitle,
        job_url: jobUrl || null,
        application_date: applicationDate || new Date().toISOString().split('T')[0],
        status,
        location: location || null,
        salary_offered: salaryOffered || null,
        salary_currency: salaryCurrency,
        employment_type: employmentType || null,
        work_arrangement: workArrangement || null,
        hr_contact: hrContact || null,
        hr_email: hrEmail || null,
        hr_phone: hrPhone || null,
        application_method: applicationMethod || null,
        referral_source: referralSource || null,
        notes: notes || null,
        cover_letter_used: coverLetterUsed || null,
        interview_rounds: 0
      }
    } catch (e) {
      // Fallback to original structure
      insertData = {
        user_id: userId,
        cv_id: cvId || null,
        job_url: jobUrl || `${companyName} - ${positionTitle}`,
        task_id: `manual-${Date.now()}`,
        status,
        cv_data: {
          company_name: companyName,
          position_title: positionTitle,
          application_date: applicationDate,
          location,
          salary_offered: salaryOffered,
          notes
        },
        results: null,
        error: null
      }
    }

    const { data: application, error } = await supabaseAdmin
      .from('job_applications')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
    }

    // Log activity - only if application_activities table exists
    try {
      await supabaseAdmin
        .from('application_activities')
        .insert({
          application_id: application.id,
          user_id: userId,
          activity_type: 'application_created',
          description: `Application created for ${positionTitle} at ${companyName}`,
          metadata: { status }
        })
    } catch (activityError) {
      // Ignore activity logging errors for now
      console.log('Activity logging skipped:', activityError.message)
    }

    return NextResponse.json({ application }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
