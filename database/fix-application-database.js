const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixApplicationTables() {
  try {
    console.log('🔧 Fixing Application Management Tables...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-application-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: statement
          })
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message)
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message)
          // Continue with other statements
        }
      }
    }
    
    // Verify table creation
    console.log('\n🔍 Verifying table creation...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['job_applications', 'application_documents', 'application_activities'])
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message)
    } else {
      const tableNames = tables.map(t => t.table_name)
      console.log('✅ Found tables:', tableNames.join(', '))
      
      if (tableNames.includes('job_applications')) {
        console.log('✅ job_applications table exists')
      } else {
        console.error('❌ job_applications table not found')
      }
      
      if (tableNames.includes('application_documents')) {
        console.log('✅ application_documents table exists')
      } else {
        console.error('❌ application_documents table not found')
      }
      
      if (tableNames.includes('application_activities')) {
        console.log('✅ application_activities table exists')
      } else {
        console.error('❌ application_activities table not found')
      }
    }
    
    // Test basic operations
    console.log('\n🧪 Testing basic operations...')
    
    try {
      // Test insert
      const { data: testApp, error: insertError } = await supabase
        .from('job_applications')
        .insert({
          user_id: 'test-user-fix',
          company_name: 'Test Company',
          position_title: 'Test Position',
          status: 'applied'
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError.message)
      } else {
        console.log('✅ Insert test successful')
        
        // Test select
        const { data: selectData, error: selectError } = await supabase
          .from('job_applications')
          .select('*')
          .eq('id', testApp.id)
          .single()
        
        if (selectError) {
          console.error('❌ Select test failed:', selectError.message)
        } else {
          console.log('✅ Select test successful')
        }
        
        // Test activity insert
        const { data: activity, error: activityError } = await supabase
          .from('application_activities')
          .insert({
            application_id: testApp.id,
            user_id: 'test-user-fix',
            activity_type: 'application_created',
            description: 'Test activity'
          })
          .select()
          .single()
        
        if (activityError) {
          console.error('❌ Activity insert test failed:', activityError.message)
        } else {
          console.log('✅ Activity insert test successful')
        }
        
        // Cleanup test data
        await supabase.from('job_applications').delete().eq('id', testApp.id)
        console.log('✅ Test data cleaned up')
      }
    } catch (testError) {
      console.error('❌ Test operations failed:', testError.message)
    }
    
    console.log('\n🎉 Application tables fix completed!')
    
  } catch (error) {
    console.error('❌ Error fixing application tables:', error.message)
    process.exit(1)
  }
}

// Run the fix
fixApplicationTables()
