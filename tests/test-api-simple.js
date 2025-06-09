// Simple API test without database dependencies
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

async function testAPI() {
  const baseUrl = 'http://localhost:3000'
  const testUserId = 'test-user-' + Date.now()

  console.log('🧪 Testing Application API...')

  try {
    // Test 1: Create application
    console.log('\n1️⃣ Testing POST /api/applications...')
    
    const createPayload = {
      userId: testUserId,
      companyName: 'Test Company API',
      positionTitle: 'Software Engineer',
      status: 'applied',
      location: 'Jakarta',
      notes: 'Test application via API'
    }

    const createResponse = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    })

    console.log('Response status:', createResponse.status)
    
    if (createResponse.ok) {
      const createResult = await createResponse.json()
      console.log('✅ Create successful')
      console.log('Application ID:', createResult.application?.id)
      
      // Test 2: Get applications
      console.log('\n2️⃣ Testing GET /api/applications...')
      
      const getResponse = await fetch(`${baseUrl}/api/applications?userId=${testUserId}&limit=5`)
      console.log('Get response status:', getResponse.status)
      
      if (getResponse.ok) {
        const getResult = await getResponse.json()
        console.log('✅ Get successful')
        console.log('Applications found:', getResult.applications?.length || 0)
        console.log('Total:', getResult.pagination?.total || 0)
      } else {
        const getError = await getResponse.text()
        console.log('❌ Get failed:', getError)
      }
      
      // Test 3: Get stats
      console.log('\n3️⃣ Testing GET /api/applications/stats...')
      
      const statsResponse = await fetch(`${baseUrl}/api/applications/stats?userId=${testUserId}`)
      console.log('Stats response status:', statsResponse.status)
      
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json()
        console.log('✅ Stats successful')
        console.log('Total applications:', statsResult.stats?.total || 0)
      } else {
        const statsError = await statsResponse.text()
        console.log('❌ Stats failed:', statsError)
      }
      
    } else {
      const createError = await createResponse.text()
      console.log('❌ Create failed:', createError)
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }

  console.log('\n🎉 API test completed!')
}

// Check if server is running
fetch('http://localhost:3000')
  .then(() => {
    console.log('✅ Server is running, starting tests...')
    testAPI()
  })
  .catch(() => {
    console.log('❌ Server not running. Start with: npm run dev')
  })
