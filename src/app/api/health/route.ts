import { NextRequest, NextResponse } from 'next/server'
import { testSupabaseConnection } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'checking',
      services: {
        database: { status: 'unknown', error: null },
        environment: { status: 'unknown', variables: {} }
      }
    }

    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      MISTRAL_API_KEY: !!process.env.MISTRAL_API_KEY,
      BROWSER_USE_API_KEY: !!process.env.BROWSER_USE_API_KEY
    }

    healthCheck.services.environment = {
      status: Object.values(envVars).every(Boolean) ? 'healthy' : 'degraded',
      variables: envVars
    }

    // Test database connection
    const dbTest = await testSupabaseConnection()
    healthCheck.services.database = {
      status: dbTest.success ? 'healthy' : 'unhealthy',
      error: dbTest.error || null
    }

    // Overall status
    const allHealthy = Object.values(healthCheck.services).every(
      service => service.status === 'healthy'
    )
    healthCheck.status = allHealthy ? 'healthy' : 'degraded'

    const statusCode = allHealthy ? 200 : 503

    return NextResponse.json(healthCheck, { status: statusCode })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: { status: 'error', error: 'Health check failed' },
        environment: { status: 'error', error: 'Health check failed' }
      }
    }, { status: 500 })
  }
}
