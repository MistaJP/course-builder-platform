import { NextRequest, NextResponse } from 'next/server'
import { listAvatars, listVoices, generateVideo, getVideoStatus } from '@/lib/heygen'

// Read API key from env at request time
function getApiKey(): string {
  const apiKey = process.env.HEYGEN_API_KEY
  if (!apiKey) {
    throw new Error('HEYGEN_API_KEY environment variable is not set')
  }
  return apiKey
}

// GET /api/heygen?type=avatars - List available avatars
export async function GET(request: NextRequest) {
  try {
    const apiKey = getApiKey()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    if (type === 'avatars') {
      const avatars = await listAvatars(apiKey)
      return NextResponse.json({ avatars })
    }
    
    if (type === 'voices') {
      const voices = await listVoices(apiKey)
      return NextResponse.json({ voices })
    }
    
    if (type === 'status') {
      const videoId = searchParams.get('videoId')
      if (!videoId) {
        return NextResponse.json({ error: 'videoId required' }, { status: 400 })
      }
      const status = await getVideoStatus(videoId, apiKey)
      return NextResponse.json(status)
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('HeyGen API error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

// POST /api/heygen/generate - Generate a new video
export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey()
    const body = await request.json()
    const { avatar_id, voice_id, script, background, dimension } = body
    
    if (!avatar_id || !voice_id || !script) {
      return NextResponse.json(
        { error: 'avatar_id, voice_id, and script are required' },
        { status: 400 }
      )
    }
    
    // Validate script length (HeyGen limit is 5000 chars)
    if (script.length > 5000) {
      return NextResponse.json(
        { error: 'Script exceeds 5000 character limit' },
        { status: 400 }
      )
    }
    
    const result = await generateVideo({
      avatar_id,
      voice_id,
      script,
      background,
      dimension
    }, apiKey)
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('HeyGen generate error:', error)
    return NextResponse.json(
      { error: 'Video generation failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
