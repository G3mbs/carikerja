import { NextRequest, NextResponse } from 'next/server'
import { MistralService } from '@/lib/mistral'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables first
    if (!process.env.MISTRAL_API_KEY) {
      console.error('MISTRAL_API_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    // Validate Supabase connection
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured')
      return NextResponse.json(
        { error: 'Database service not configured' },
        { status: 500 }
      )
    }

    // Parse and validate request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { cvId, userId } = requestBody

    if (!cvId || !userId) {
      return NextResponse.json(
        { error: 'CV ID and User ID required' },
        { status: 400 }
      )
    }

    // Validate input types
    if (typeof cvId !== 'string' || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'CV ID and User ID must be strings' },
        { status: 400 }
      )
    }

    // Get CV from database with detailed error handling
    console.log(`Fetching CV with ID: ${cvId} for user: ${userId}`)

    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .eq('user_id', userId)
      .single()

    if (cvError) {
      console.error('Database query error:', cvError)

      // Handle specific error cases
      if (cvError.message.includes('multiple (or no) rows returned')) {
        console.log(`CV not found for ID: ${cvId}, User: ${userId}`)
        return NextResponse.json(
          { error: 'CV not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: `Database error: ${cvError.message}` },
        { status: 500 }
      )
    }

    if (!cv) {
      console.log(`CV not found for ID: ${cvId}, User: ${userId}`)
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      )
    }

    // Validate CV content
    if (!cv.content || typeof cv.content !== 'string' || cv.content.trim().length === 0) {
      console.error('CV content is empty or invalid:', { cvId, contentLength: cv.content?.length })
      return NextResponse.json(
        { error: 'CV content is empty or invalid. Please re-upload your CV.' },
        { status: 400 }
      )
    }

    console.log(`CV found. Content length: ${cv.content.length} characters`)

    // Analyze CV with Mistral AI
    console.log('Starting CV analysis with Mistral AI...')

    let analysis
    try {
      const mistralService = new MistralService()
      analysis = await mistralService.analyzeCV(cv.content)
      console.log('CV analysis completed successfully')
    } catch (mistralError) {
      console.error('Mistral AI analysis error:', mistralError)
      return NextResponse.json(
        { error: `AI analysis failed: ${mistralError instanceof Error ? mistralError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Validate analysis result
    if (!analysis || typeof analysis !== 'object') {
      console.error('Invalid analysis result:', analysis)
      return NextResponse.json(
        { error: 'AI analysis returned invalid result' },
        { status: 500 }
      )
    }

    // Update CV record with analysis
    console.log('Saving analysis to database...')

    const { error: updateError } = await supabaseAdmin
      .from('cvs')
      .update({
        analysis: analysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', cvId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: `Failed to save analysis: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log('CV analysis completed and saved successfully')

    return NextResponse.json({
      success: true,
      analysis: analysis,
      message: 'CV analysis completed successfully'
    })

  } catch (error) {
    console.error('Unexpected error in CV analysis:', error)

    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('Error stack:', errorStack)

    return NextResponse.json(
      {
        error: 'Failed to analyze CV',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
