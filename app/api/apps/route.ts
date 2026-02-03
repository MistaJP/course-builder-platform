import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createAppSchema = z.object({
  name: z.string().min(1),
  domains: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const apps = await prisma.app.findMany({
      include: {
        _count: {
          select: { courses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(apps)
  } catch (error) {
    console.error('Error fetching apps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createAppSchema.parse(body)
    
    const app = await prisma.app.create({
      data: {
        name: validated.name,
        domains: validated.domains || []
      }
    })
    
    return NextResponse.json(app, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating app:', error)
    return NextResponse.json(
      { error: 'Failed to create app' },
      { status: 500 }
    )
  }
}
