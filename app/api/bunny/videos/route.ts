import { NextRequest, NextResponse } from 'next/server'
import { createVideo, getVideo } from '@/lib/bunny'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { title, courseId } = await request.json()
    
    if (!title || !courseId) {
      return NextResponse.json(
        { error: 'Title and courseId required' },
        { status: 400 }
      )
    }

    // Create video in Bunny
    const bunnyVideo = await createVideo(title)
    
    // Get the highest order in this course
    const lastVideo = await prisma.video.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' }
    })
    
    // Save to database
    const video = await prisma.video.create({
      data: {
        title,
        bunnyId: bunnyVideo.guid,
        courseId,
        order: lastVideo ? lastVideo.order + 1 : 0
      }
    })
    
    // Return the direct upload URL and API key for client-side upload
    return NextResponse.json({
      video,
      uploadUrl: bunnyVideo.uploadUrl,
      videoId: bunnyVideo.guid,
      apiKey: process.env.BUNNY_API_KEY // Safe to expose for upload only
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json(
      { error: 'Failed to create video', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Check video status after upload
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bunnyId = searchParams.get('bunnyId')
    
    if (!bunnyId) {
      return NextResponse.json(
        { error: 'bunnyId required' },
        { status: 400 }
      )
    }
    
    const videoInfo = await getVideo(bunnyId)
    
    return NextResponse.json({
      status: videoInfo.status,
      length: videoInfo.length,
      thumbnailFileName: videoInfo.thumbnailFileName,
      isReady: videoInfo.status === 3 // 3 = ready in Bunny
    })
  } catch (error) {
    console.error('Error getting video status:', error)
    return NextResponse.json(
      { error: 'Failed to get video status' },
      { status: 500 }
    )
  }
}
