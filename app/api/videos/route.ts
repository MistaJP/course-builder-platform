import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createVideoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  bunnyId: z.string().min(1),
  duration: z.number().optional(),
  courseId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createVideoSchema.parse(body)
    
    // Get the highest order in this course
    const lastVideo = await prisma.video.findFirst({
      where: { courseId: validated.courseId },
      orderBy: { order: 'desc' }
    })
    
    const video = await prisma.video.create({
      data: {
        ...validated,
        order: lastVideo ? lastVideo.order + 1 : 0
      }
    })
    
    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating video:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
