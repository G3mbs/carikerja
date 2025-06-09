const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  try {
    console.log('🔍 Checking current table structure...')
    
    // Check if job_applications table exists and get its structure
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'job_applications')
      .order('ordinal_position')
    
    if (error) {
      console.error('❌ Error checking columns:', error.message)
      
      // Try to check if table exists at all
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%application%')
      
      if (tableError) {
        console.error('❌ Error checking tables:', tableError.message)
      } else {
        console.log('📋 Found application-related tables:', tables.map(t => t.table_name))
      }
      
      return
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ job_applications table exists with columns:')
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    } else {
      console.log('❌ job_applications table not found or has no columns')
    }
    
    // Try a simple select to see what happens
    console.log('\n🧪 Testing simple select...')
    const { data: testData, error: selectError } = await supabase
      .from('job_applications')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.error('❌ Select test failed:', selectError.message)
    } else {
      console.log('✅ Select test successful, found', testData?.length || 0, 'records')
    }
    
    // Check other related tables
    console.log('\n🔍 Checking related tables...')
    const relatedTables = ['application_documents', 'application_activities']
    
    for (const tableName of relatedTables) {
      const { data: tableColumns, error: tableError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
      
      if (tableError) {
        console.log(`❌ ${tableName}: ${tableError.message}`)
      } else if (tableColumns && tableColumns.length > 0) {
        console.log(`✅ ${tableName}: ${tableColumns.length} columns`)
      } else {
        console.log(`❌ ${tableName}: not found`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkTables()
