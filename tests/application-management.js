const { createClient } = require('@supabase/supabase-js')

// Hardcode the values for testing
const supabaseUrl = 'https://eowwtefepmnxtdkrbour.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvd3d0ZWZlcG14bnRka3Jib3VyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTI5MjM2OCwiZXhwIjoyMDY0ODY4MzY4fQ.XTgO0xj355ZfBtuhE1ZG90UgasjskIs4csM_jP1v-sY'

console.log('🧪 Testing Application Management System...\n')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testApplicationManagement() {
  const testUserId = 'test-user-' + Date.now()
  let testApplicationId = null

  try {
    console.log('1️⃣ Testing Database Tables...')
    
    // Test if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['job_applications', 'application_documents', 'application_activities'])

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message)
      return
    }

    const tableNames = tables.map(t => t.table_name)
    console.log('✅ Found tables:', tableNames.join(', '))

    if (!tableNames.includes('job_applications')) {
      console.error('❌ job_applications table not found')
      return
    }

    console.log('\n2️⃣ Testing Create Application...')
    
    // Create test application
    const { data: newApplication, error: createError } = await supabase
      .from('job_applications')
      .insert({
        user_id: testUserId,
        company_name: 'PT. Test Company',
        position_title: 'Software Engineer',
        job_url: 'https://example.com/job/123',
        application_date: '2024-01-15',
        status: 'applied',
        location: 'Jakarta, Indonesia',
        salary_offered: 8000000,
        salary_currency: 'IDR',
        employment_type: 'full-time',
        work_arrangement: 'hybrid',
        hr_contact: 'Jane Doe',
        hr_email: 'jane@testcompany.com',
        notes: 'Applied through company website'
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating application:', createError.message)
      return
    }

    testApplicationId = newApplication.id
    console.log('✅ Application created with ID:', testApplicationId)

    console.log('\n3️⃣ Testing Read Application...')
    
    // Read application
    const { data: readApplication, error: readError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', testApplicationId)
      .single()

    if (readError) {
      console.error('❌ Error reading application:', readError.message)
      return
    }

    console.log('✅ Application read successfully')
    console.log('   Company:', readApplication.company_name)
    console.log('   Position:', readApplication.position_title)
    console.log('   Status:', readApplication.status)

    console.log('\n4️⃣ Testing Update Application...')
    
    // Update application
    const { data: updatedApplication, error: updateError } = await supabase
      .from('job_applications')
      .update({
        status: 'interview',
        interview_rounds: 1,
        next_interview_date: '2024-01-20T10:00:00Z',
        notes: 'Updated: Scheduled for first interview'
      })
      .eq('id', testApplicationId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating application:', updateError.message)
      return
    }

    console.log('✅ Application updated successfully')
    console.log('   New Status:', updatedApplication.status)
    console.log('   Interview Rounds:', updatedApplication.interview_rounds)

    console.log('\n5️⃣ Testing Application Activities...')
    
    // Create activity log
    const { data: activity, error: activityError } = await supabase
      .from('application_activities')
      .insert({
        application_id: testApplicationId,
        user_id: testUserId,
        activity_type: 'status_change',
        old_value: 'applied',
        new_value: 'interview',
        description: 'Status changed from applied to interview'
      })
      .select()
      .single()

    if (activityError) {
      console.error('❌ Error creating activity:', activityError.message)
      return
    }

    console.log('✅ Activity logged successfully')
    console.log('   Activity Type:', activity.activity_type)
    console.log('   Description:', activity.description)

    console.log('\n6️⃣ Testing Application Documents...')
    
    // Create document record
    const { data: document, error: documentError } = await supabase
      .from('application_documents')
      .insert({
        application_id: testApplicationId,
        user_id: testUserId,
        document_type: 'cv',
        file_name: 'cv_software_engineer.pdf',
        file_path: '/documents/cv_software_engineer.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        version: 1
      })
      .select()
      .single()

    if (documentError) {
      console.error('❌ Error creating document:', documentError.message)
      return
    }

    console.log('✅ Document record created successfully')
    console.log('   Document Type:', document.document_type)
    console.log('   File Name:', document.file_name)

    console.log('\n7️⃣ Testing Statistics Query...')
    
    // Test statistics query
    const { data: stats, error: statsError } = await supabase
      .from('job_applications')
      .select('status')
      .eq('user_id', testUserId)

    if (statsError) {
      console.error('❌ Error getting statistics:', statsError.message)
      return
    }

    const statusCount = {}
    stats.forEach(app => {
      statusCount[app.status] = (statusCount[app.status] || 0) + 1
    })

    console.log('✅ Statistics calculated successfully')
    console.log('   Status Distribution:', statusCount)

    console.log('\n8️⃣ Testing Filters and Search...')
    
    // Test filtering
    const { data: filteredApps, error: filterError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('status', 'interview')
      .ilike('company_name', '%Test%')

    if (filterError) {
      console.error('❌ Error filtering applications:', filterError.message)
      return
    }

    console.log('✅ Filtering works successfully')
    console.log('   Filtered Results:', filteredApps.length, 'applications')

    console.log('\n9️⃣ Testing Pagination...')
    
    // Test pagination
    const { data: paginatedApps, error: paginationError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', testUserId)
      .order('application_date', { ascending: false })
      .range(0, 9) // First 10 items

    if (paginationError) {
      console.error('❌ Error with pagination:', paginationError.message)
      return
    }

    console.log('✅ Pagination works successfully')
    console.log('   Page Results:', paginatedApps.length, 'applications')

    console.log('\n🔟 Testing Joins and Relations...')
    
    // Test join with activities and documents
    const { data: fullApplication, error: joinError } = await supabase
      .from('job_applications')
      .select(`
        *,
        application_documents (*),
        application_activities (*)
      `)
      .eq('id', testApplicationId)
      .single()

    if (joinError) {
      console.error('❌ Error with joins:', joinError.message)
      return
    }

    console.log('✅ Joins work successfully')
    console.log('   Documents:', fullApplication.application_documents?.length || 0)
    console.log('   Activities:', fullApplication.application_activities?.length || 0)

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  } finally {
    // Cleanup
    if (testApplicationId) {
      console.log('\n🧹 Cleaning up test data...')
      
      // Delete test application (will cascade to documents and activities)
      const { error: deleteError } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', testApplicationId)

      if (deleteError) {
        console.error('❌ Error cleaning up:', deleteError.message)
      } else {
        console.log('✅ Test data cleaned up successfully')
      }
    }
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...')
  
  const baseUrl = 'http://localhost:3000'
  const testUserId = 'test-user-api-' + Date.now()

  try {
    // Test create application
    console.log('1️⃣ Testing POST /api/applications...')
    
    const createResponse = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId,
        companyName: 'API Test Company',
        positionTitle: 'API Test Position',
        status: 'applied',
        location: 'Jakarta'
      })
    })

    if (!createResponse.ok) {
      console.error('❌ API Create failed:', createResponse.status)
      return
    }

    const { application } = await createResponse.json()
    console.log('✅ API Create successful, ID:', application.id)

    // Test get applications
    console.log('\n2️⃣ Testing GET /api/applications...')
    
    const getResponse = await fetch(`${baseUrl}/api/applications?userId=${testUserId}`)
    
    if (!getResponse.ok) {
      console.error('❌ API Get failed:', getResponse.status)
      return
    }

    const { applications, pagination } = await getResponse.json()
    console.log('✅ API Get successful')
    console.log('   Applications:', applications.length)
    console.log('   Total:', pagination.total)

    // Test get stats
    console.log('\n3️⃣ Testing GET /api/applications/stats...')
    
    const statsResponse = await fetch(`${baseUrl}/api/applications/stats?userId=${testUserId}`)
    
    if (!statsResponse.ok) {
      console.error('❌ API Stats failed:', statsResponse.status)
      return
    }

    const { stats } = await statsResponse.json()
    console.log('✅ API Stats successful')
    console.log('   Total Applications:', stats.total)
    console.log('   By Status:', stats.byStatus)

    // Cleanup
    console.log('\n🧹 Cleaning up API test data...')
    const { error: cleanupError } = await supabase
      .from('job_applications')
      .delete()
      .eq('user_id', testUserId)

    if (cleanupError) {
      console.error('❌ API Cleanup failed:', cleanupError.message)
    } else {
      console.log('✅ API test data cleaned up')
    }

  } catch (error) {
    console.error('❌ API Test error:', error.message)
  }
}

// Run tests
async function runAllTests() {
  await testApplicationManagement()
  
  // Only test API if server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/applications/stats?userId=health-check')
    if (healthCheck.status === 400) { // Expected error for missing userId
      await testAPIEndpoints()
    }
  } catch (error) {
    console.log('\n⚠️  Skipping API tests - server not running')
    console.log('   Start the server with "npm run dev" to test API endpoints')
  }

  console.log('\n🎉 Application Management System tests completed!')
}

runAllTests()
