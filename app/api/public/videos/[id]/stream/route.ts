import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Bunny.net CDN URL - you'll configure this with your library ID
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || 'https://vz-{libraryId}.b-cdn.net'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = request.headers.get('x-api-key')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      )
    }
    
    const app = await prisma.app.findUnique({
      where: { apiKey }
    })
    
    if (!app) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    const { id } = await params
    const video = await prisma.video.findFirst({
      where: {
        id,
        course: {
          appId: app.id,
          published: true
        }
      },
      include: {
        course: true
      }
    })
    
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }
    
    // Return the Bunny.net video ID and embed info
    // The client will use this to construct the iframe embed
    return NextResponse.json({
      id: video.id,
      title: video.title,
      description: video.description,
      duration: video.duration,
      bunnyId: video.bunnyId,
      // The embed URL will be constructed on the client side
      // Format: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
    })
  } catch (error) {
    console.error('Error fetching video stream:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    )
  }
}
