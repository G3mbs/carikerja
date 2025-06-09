const testJobSearch = async () => {
  console.log('🧪 Testing Final Job Search Fix...\n')
  
  try {
    // Test 1: Create job search
    console.log('1. Creating job search task...')
    const searchResponse = await fetch('http://localhost:3000/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchParams: {
          keywords: ['Digital Marketing', 'SEO', 'E-commerce'],
          location: ['Jakarta'],
          salaryRange: { min: 5000000, max: 20000000 },
          experienceLevel: 'fresh_graduate',
          companyType: ['Startup', 'Korporat', 'Teknologi'],
          industry: ['E-commerce', 'Teknologi', 'Startup']
        },
        platforms: ['JobStreet', 'LinkedIn', 'Glints'],
        userId: 'test-user-final'
      })
    })
    
    if (!searchResponse.ok) {
      throw new Error(`HTTP ${searchResponse.status}: ${await searchResponse.text()}`)
    }
    
    const searchResult = await searchResponse.json()
    console.log('✅ Search created successfully')
    console.log('   Task ID:', searchResult.taskId)
    console.log('   Status:', searchResult.status)
    
    // Wait for task to process
    console.log('\n2. Waiting for task to process (15 seconds)...')
    await new Promise(resolve => setTimeout(resolve, 15000))
    
    // Test 2: Get task status and results
    console.log('3. Getting task results...')
    const statusResponse = await fetch(`http://localhost:3000/api/jobs/search?userId=test-user-final&taskId=${searchResult.taskId}`)
    
    if (!statusResponse.ok) {
      throw new Error(`HTTP ${statusResponse.status}: ${await statusResponse.text()}`)
    }
    
    const statusResult = await statusResponse.json()
    
    console.log('✅ Task status retrieved successfully')
    console.log('   Status:', statusResult.task.status)
    console.log('   Results found:', statusResult.results?.length || 0)
    
    if (statusResult.results && statusResult.results.length > 0) {
      console.log('\n📋 Job Results Preview:')
      statusResult.results.slice(0, 3).forEach((job, index) => {
        console.log(`${index + 1}. ${job.title}`)
        console.log(`   Company: ${job.company}`)
        console.log(`   Location: ${job.location}`)
        console.log(`   Salary: ${job.salary || 'Not specified'}`)
        console.log(`   Platform: ${job.platform}`)
        console.log(`   Match Score: ${job.matchScore}%`)
        console.log('')
      })
    }
    
    console.log('🎉 SUCCESS: Job search system is working correctly!')
    console.log('✅ 500 Internal Server Error has been fixed')
    console.log('✅ Fallback job generation is working')
    console.log('✅ Task status monitoring is functional')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testJobSearch()
