import { NextRequest, NextResponse } from 'next/server'
import { MistralService } from '@/lib/mistral'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { position, industry, location, userId } = await request.json()

    if (!position || !industry || !userId) {
      return NextResponse.json(
        { error: 'Position, industry, and user ID required' },
        { status: 400 }
      )
    }

    // Check if similar research exists (within last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: existingResearch } = await supabaseAdmin
      .from('market_research')
      .select('*')
      .eq('position', position)
      .eq('industry', industry)
      .eq('location', location || 'Indonesia')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingResearch && existingResearch.length > 0) {
      return NextResponse.json({
        success: true,
        research: existingResearch[0],
        cached: true
      })
    }

    // Conduct new market research
    const mistralService = new MistralService()
    const researchData = await mistralService.conductMarketResearch(
      position,
      industry,
      location || 'Indonesia'
    )

    // Save research to database
    const { data: researchRecord, error: dbError } = await supabaseAdmin
      .from('market_research')
      .insert({
        user_id: userId,
        position: position,
        industry: industry,
        location: location || 'Indonesia',
        research_data: researchData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save research data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      research: researchRecord,
      cached: false
    })

  } catch (error) {
    console.error('Market research error:', error)
    return NextResponse.json(
      { error: 'Failed to conduct market research' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const position = searchParams.get('position')
    const industry = searchParams.get('industry')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('market_research')
      .select('*')
      .eq('user_id', userId)

    if (position) {
      query = query.ilike('position', `%${position}%`)
    }

    if (industry) {
      query = query.ilike('industry', `%${industry}%`)
    }

    const { data: research, error } = await query
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch research data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      research: research
    })

  } catch (error) {
    console.error('Market research fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
