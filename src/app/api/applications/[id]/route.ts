import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/applications/[id] - Get specific application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: application, error } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        cvs:cv_id (
          id,
          filename,
          original_name,
          analysis
        ),
        application_documents (
          id,
          document_type,
          file_name,
          file_path,
          file_size,
          mime_type,
          version,
          is_active,
          uploaded_at
        ),
        application_activities (
          id,
          activity_type,
          old_value,
          new_value,
          description,
          metadata,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching application:', error)
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ application })

  } catch (error) {
    console.error('Error in GET /api/applications/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/applications/[id] - Update application
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get current application for activity logging
    const { data: currentApp } = await supabaseAdmin
      .from('job_applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!currentApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Prepare update data with proper field mapping
    const updateFields: any = {}
    
    if (updateData.companyName !== undefined) updateFields.company_name = updateData.companyName
    if (updateData.positionTitle !== undefined) updateFields.position_title = updateData.positionTitle
    if (updateData.jobUrl !== undefined) updateFields.job_url = updateData.jobUrl
    if (updateData.applicationDate !== undefined) updateFields.application_date = updateData.applicationDate
    if (updateData.status !== undefined) updateFields.status = updateData.status
    if (updateData.location !== undefined) updateFields.location = updateData.location
    if (updateData.salaryOffered !== undefined) updateFields.salary_offered = updateData.salaryOffered
    if (updateData.salaryCurrency !== undefined) updateFields.salary_currency = updateData.salaryCurrency
    if (updateData.employmentType !== undefined) updateFields.employment_type = updateData.employmentType
    if (updateData.workArrangement !== undefined) updateFields.work_arrangement = updateData.workArrangement
    if (updateData.hrContact !== undefined) updateFields.hr_contact = updateData.hrContact
    if (updateData.hrEmail !== undefined) updateFields.hr_email = updateData.hrEmail
    if (updateData.hrPhone !== undefined) updateFields.hr_phone = updateData.hrPhone
    if (updateData.applicationMethod !== undefined) updateFields.application_method = updateData.applicationMethod
    if (updateData.referralSource !== undefined) updateFields.referral_source = updateData.referralSource
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes
    if (updateData.coverLetterUsed !== undefined) updateFields.cover_letter_used = updateData.coverLetterUsed
    if (updateData.interviewRounds !== undefined) updateFields.interview_rounds = updateData.interviewRounds
    if (updateData.nextInterviewDate !== undefined) updateFields.next_interview_date = updateData.nextInterviewDate
    if (updateData.assessmentType !== undefined) updateFields.assessment_type = updateData.assessmentType
    if (updateData.assessmentDeadline !== undefined) updateFields.assessment_deadline = updateData.assessmentDeadline
    if (updateData.offerReceivedDate !== undefined) updateFields.offer_received_date = updateData.offerReceivedDate
    if (updateData.offerDeadline !== undefined) updateFields.offer_deadline = updateData.offerDeadline
    if (updateData.offerSalary !== undefined) updateFields.offer_salary = updateData.offerSalary
    if (updateData.offerBenefits !== undefined) updateFields.offer_benefits = updateData.offerBenefits

    // Update application
    const { data: application, error } = await supabaseAdmin
      .from('job_applications')
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating application:', error)
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    // Log activities for significant changes
    const activities = []

    // Status change
    if (updateData.status && updateData.status !== currentApp.status) {
      activities.push({
        application_id: id,
        user_id: userId,
        activity_type: 'status_change',
        old_value: currentApp.status,
        new_value: updateData.status,
        description: `Status changed from ${currentApp.status} to ${updateData.status}`
      })
    }

    // Notes added/updated
    if (updateData.notes && updateData.notes !== currentApp.notes) {
      activities.push({
        application_id: id,
        user_id: userId,
        activity_type: 'note_added',
        description: 'Notes updated',
        metadata: { notes: updateData.notes }
      })
    }

    // Interview scheduled
    if (updateData.nextInterviewDate && updateData.nextInterviewDate !== currentApp.next_interview_date) {
      activities.push({
        application_id: id,
        user_id: userId,
        activity_type: 'interview_scheduled',
        new_value: updateData.nextInterviewDate,
        description: `Interview scheduled for ${updateData.nextInterviewDate}`
      })
    }

    // Offer received
    if (updateData.offerReceivedDate && updateData.offerReceivedDate !== currentApp.offer_received_date) {
      activities.push({
        application_id: id,
        user_id: userId,
        activity_type: 'offer_received',
        new_value: updateData.offerReceivedDate,
        description: `Offer received on ${updateData.offerReceivedDate}`,
        metadata: { 
          salary: updateData.offerSalary,
          deadline: updateData.offerDeadline 
        }
      })
    }

    // Insert activities
    if (activities.length > 0) {
      await supabaseAdmin
        .from('application_activities')
        .insert(activities)
    }

    return NextResponse.json({ application })

  } catch (error) {
    console.error('Error in PUT /api/applications/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/applications/[id] - Delete application
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('job_applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting application:', error)
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Application deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/applications/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
