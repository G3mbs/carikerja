import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Check if we have valid Supabase configuration
const hasValidSupabaseConfig = supabaseUrl.startsWith('https://') &&
                               supabaseAnonKey.length > 10 &&
                               !supabaseUrl.includes('your_supabase_url_here')

// Enhanced client options for better error handling and debugging
const clientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'carikerja-app'
    }
  }
}

export const supabase = hasValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, clientOptions)
  : null

// For server-side operations
export const supabaseAdmin = hasValidSupabaseConfig && supabaseServiceKey.length > 10
  ? createClient(supabaseUrl, supabaseServiceKey, {
      ...clientOptions,
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  : null

// Connection test function
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('cvs')
      .select('count')
      .limit(1)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    }
  }
}
