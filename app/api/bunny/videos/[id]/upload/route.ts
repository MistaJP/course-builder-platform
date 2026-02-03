import { NextRequest, NextResponse } from 'next/server'
import { uploadVideo } from '@/lib/bunny'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await uploadVideo(id, buffer, file.type)
    
    console.log('Upload successful for video:', id)
    
    return NextResponse.json({ success: true, message: 'Upload complete' })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json(
      { error: 'Failed to upload video', details: (error as Error).message },
      { status: 500 }
    )
  }
}
