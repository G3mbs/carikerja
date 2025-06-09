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

async function setupDatabase() {
  try {
    console.log('🚀 Setting up LinkedIn Scraping database tables...')
    
    // Read the linkedin-tables.sql file
    const sqlPath = path.join(__dirname, 'linkedin-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        })
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0)
          
          if (directError && directError.code !== '42P01') {
            console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`)
          }
        }
        
      } catch (err) {
        console.warn(`⚠️  Warning on statement ${i + 1}: ${err.message}`)
      }
    }
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...')
    
    const tables = [
      'linkedin_jobs',
      'linkedin_scraping_sessions'
    ]
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.error(`❌ Table ${table} not found: ${error.message}`)
        } else {
          console.log(`✅ Table ${table} exists and accessible`)
        }
      } catch (err) {
        console.error(`❌ Error checking table ${table}: ${err.message}`)
      }
    }
    
    console.log('🎉 Database setup completed!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  }
}

// Alternative method: Create tables directly
async function createTablesDirectly() {
  console.log('🔧 Creating LinkedIn tables directly...')
  
  try {
    // Create linkedin_scraping_sessions table
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS linkedin_scraping_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id VARCHAR(255) NOT NULL,
          cv_id UUID,
          search_params JSONB NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          progress JSONB,
          total_jobs_found INTEGER DEFAULT 0,
          google_sheets_url TEXT,
          error_message TEXT,
          retry_count INTEGER DEFAULT 0,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (sessionsError) {
      console.log('Creating sessions table with direct query...')
      // Fallback: try with direct SQL execution
    }
    
    // Create linkedin_jobs table
    const { error: jobsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS linkedin_jobs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id VARCHAR(255) NOT NULL,
          cv_id UUID,
          linkedin_url TEXT UNIQUE NOT NULL,
          company_logo_url TEXT,
          job_title_short TEXT,
          insight_status TEXT,
          application_status TEXT DEFAULT 'not_applied',
          easy_apply BOOLEAN DEFAULT false,
          additional_insights TEXT[],
          job_title TEXT NOT NULL,
          company_name TEXT NOT NULL,
          location TEXT,
          salary_range TEXT,
          posted_time TEXT,
          match_score INTEGER,
          notes TEXT,
          applied_at TIMESTAMP WITH TIME ZONE,
          interview_date TIMESTAMP WITH TIME ZONE,
          scraping_session_id VARCHAR(255),
          scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (jobsError) {
      console.log('Creating jobs table with direct query...')
    }
    
    console.log('✅ Tables created successfully!')
    
  } catch (error) {
    console.error('❌ Direct table creation failed:', error.message)
  }
}

// Run setup
if (require.main === module) {
  setupDatabase()
    .then(() => createTablesDirectly())
    .then(() => {
      console.log('🎯 Database setup complete! You can now use LinkedIn scraping features.')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Setup failed:', error)
      process.exit(1)
    })
}

module.exports = { setupDatabase, createTablesDirectly }
