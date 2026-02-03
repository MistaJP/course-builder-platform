import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      )
    }
    
    const app = await prisma.app.findUnique({
      where: { apiKey },
      include: {
        courses: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { videos: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!app) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      app: {
        id: app.id,
        name: app.name
      },
      courses: app.courses
    })
  } catch (error) {
    console.error('Error fetching public courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
