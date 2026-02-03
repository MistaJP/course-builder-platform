import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reorderSchema = z.object({
  videos: z.array(z.object({
    id: z.string(),
    order: z.number()
  }))
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = reorderSchema.parse(body)
    
    // Update all videos in a transaction
    await prisma.$transaction(
      validated.videos.map(video =>
        prisma.video.update({
          where: { id: video.id },
          data: { order: video.order }
        })
      )
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error reordering videos:', error)
    return NextResponse.json(
      { error: 'Failed to reorder videos' },
      { status: 500 }
    )
  }
}
