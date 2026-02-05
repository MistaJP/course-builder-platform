import { NextRequest, NextResponse } from 'next/server'
import { listAvatars, listVoices, generateVideo, getVideoStatus, pollVideoUntilComplete } from '@/lib/heygen'

// GET /api/heygen/avatars - List available avatars
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    if (type === 'avatars') {
      const avatars = await listAvatars()
      return NextResponse.json({ avatars })
    }
    
    if (type === 'voices') {
      const voices = await listVoices()
      return NextResponse.json({ voices })
    }
    
    if (type === 'status') {
      const videoId = searchParams.get('videoId')
      if (!videoId) {
        return NextResponse.json({ error: 'videoId required' }, { status: 400 })
      }
      const status = await getVideoStatus(videoId)
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
    })
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('HeyGen generate error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
