import { NextRequest, NextResponse } from 'next/server'
import { createVideo, listVideos } from '@/lib/bunny'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const videos = await listVideos()
    return NextResponse.json(videos)
  } catch (error) {
    console.error('Error listing videos:', error)
    return NextResponse.json(
      { error: 'Failed to list videos' },
      { status: 500 }
    )
  }
}

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
    
    return NextResponse.json({
      video,
      uploadUrl: bunnyVideo.uploadUrl
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
