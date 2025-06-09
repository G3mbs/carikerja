const { createClient } = require('@supabase/supabase-js')

// Hardcode the values from .env.local for testing
const supabaseUrl = 'https://eowwtefepmnxtdkrbour.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvd3d0ZWZlcG14bnRka3Jib3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTIzNjgsImV4cCI6MjA2NDg2ODM2OH0.Kez8UWFGZBBJdfvjwBB1A2B6deOk1Ia-IXfcu_KvShk'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvd3d0ZWZlcG14bnRka3Jib3VyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTI5MjM2OCwiZXhwIjoyMDY0ODY4MzY4fQ.XTgO0xj355ZfBtuhE1ZG90UgasjskIs4csM_jP1v-sY'

console.log('Testing Supabase Database Connection...\n')

console.log('Environment Variables:')
console.log('- SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
console.log('- SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
console.log('')

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Test with anon key
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

// Test with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    console.log('Testing connection with anon key...')
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('cvs')
      .select('count')
      .limit(1)
    
    if (anonError) {
      console.log('❌ Anon key test failed:', anonError.message)
    } else {
      console.log('✅ Anon key connection successful')
    }

    console.log('\nTesting connection with service role key...')
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('cvs')
      .select('count')
      .limit(1)
    
    if (adminError) {
      console.log('❌ Service role key test failed:', adminError.message)
    } else {
      console.log('✅ Service role key connection successful')
    }

    console.log('\nTesting table structure...')
    const { data: tables, error: tableError } = await supabaseAdmin
      .rpc('get_table_info', {})
      .catch(async () => {
        // Fallback: try to query each table individually
        const tableTests = []
        const tableNames = ['cvs', 'job_searches', 'job_results', 'job_applications', 'market_research', 'job_alerts']
        
        for (const tableName of tableNames) {
          try {
            const { data, error } = await supabaseAdmin
              .from(tableName)
              .select('*')
              .limit(1)
            
            if (error) {
              tableTests.push({ table: tableName, status: 'error', message: error.message })
            } else {
              tableTests.push({ table: tableName, status: 'ok', count: data?.length || 0 })
            }
          } catch (err) {
            tableTests.push({ table: tableName, status: 'error', message: err.message })
          }
        }
        
        return { data: tableTests, error: null }
      })

    if (tables?.data) {
      console.log('\nTable Status:')
      tables.data.forEach(table => {
        if (table.status === 'ok') {
          console.log(`✅ ${table.table}: Available`)
        } else {
          console.log(`❌ ${table.table}: ${table.message}`)
        }
      })
    }

    console.log('\nTesting insert operation...')
    const testUserId = 'test-user-' + Date.now()
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('cvs')
      .insert({
        user_id: testUserId,
        filename: 'test.pdf',
        original_name: 'test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        content: 'Test content',
        basic_info: { name: 'Test User' },
        analysis: null,
        version: 1,
        is_active: true
      })
      .select()

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message)
      console.log('Error details:', insertError)
    } else {
      console.log('✅ Insert test successful')
      
      // Clean up test data
      await supabaseAdmin
        .from('cvs')
        .delete()
        .eq('user_id', testUserId)
      
      console.log('✅ Test data cleaned up')
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    console.error('Full error:', error)
  }
}

testConnection()
