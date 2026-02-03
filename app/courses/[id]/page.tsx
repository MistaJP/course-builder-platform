'use client'

import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Video {
  id: string
  title: string
  description: string | null
  bunnyId: string
  duration: number | null
  order: number
}

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  published: boolean
  videos: Video[]
  app: {
    id: string
    name: string
    apiKey: string
  }
}

interface UploadingVideo {
  id: string
  title: string
  bunnyId: string
  uploadUrl: string
  apiKey: string
  progress: number
  status: 'uploading' | 'processing' | 'done' | 'error'
  error?: string
}

async function fetchCourse(id: string): Promise<Course> {
  const res = await fetch(`/api/courses/${id}`)
  if (!res.ok) throw new Error('Failed to fetch course')
  return res.json()
}

async function updateCourse(id: string, data: Partial<Course>) {
  const res = await fetch(`/api/courses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update course')
  return res.json()
}

async function reorderVideos(videos: { id: string; order: number }[]) {
  const res = await fetch('/api/videos/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videos })
  })
  if (!res.ok) throw new Error('Failed to reorder videos')
  return res.json()
}

async function deleteVideo(id: string) {
  const res = await fetch(`/api/videos/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete video')
  return res.json()
}

function SortableVideoItem({ video, onDelete }: { video: Video; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: video.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{video.title}</h4>
        {video.description && (
          <p className="text-sm text-gray-600 line-clamp-1">{video.description}</p>
        )}
      </div>

      <div className="text-sm text-gray-500">
        {formatDuration(video.duration)}
      </div>

      <button
        onClick={() => onDelete(video.id)}
        className="text-red-500 hover:text-red-700 p-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

export default function CourseEditorPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const courseId = params.id as string
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [newVideoTitle, setNewVideoTitle] = useState('')
  const [uploadingVideos, setUploadingVideos] = useState<UploadingVideo[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId)
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const publishMutation = useMutation({
    mutationFn: (published: boolean) => updateCourse(courseId, { published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
    }
  })

  const reorderMutation = useMutation({
    mutationFn: reorderVideos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
    }
  })

  const deleteVideoMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
    }
  })

  const createVideoMutation = useMutation({
    mutationFn: async ({ title, courseId }: { title: string; courseId: string }) => {
      const res = await fetch('/api/bunny/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, courseId })
      })
      if (!res.ok) throw new Error('Failed to create video')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      setShowAddVideo(false)
      setNewVideoTitle('')
      
      // Add to uploading videos list and trigger file picker
      setUploadingVideos(prev => [...prev, {
        id: data.video.id,
        title: data.video.title,
        bunnyId: data.videoId,
        uploadUrl: data.uploadUrl,
        apiKey: data.apiKey,
        progress: 0,
        status: 'uploading'
      }])
      
      // Open file picker after a short delay
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 100)
    }
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = course?.videos.findIndex(v => v.id === active.id) ?? -1
      const newIndex = course?.videos.findIndex(v => v.id === over.id) ?? -1

      if (oldIndex !== -1 && newIndex !== -1) {
        const newVideos = arrayMove(course!.videos, oldIndex, newIndex)
        const reordered = newVideos.map((v, i) => ({ id: v.id, order: i }))
        reorderMutation.mutate(reordered)
      }
    }
  }

  const handleCreateVideo = () => {
    if (!newVideoTitle) return
    createVideoMutation.mutate({
      title: newVideoTitle,
      courseId
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || uploadingVideos.length === 0) return

    const uploadingVideo = uploadingVideos[uploadingVideos.length - 1]
    
    setUploadingVideos(prev => 
      prev.map(v => v.id === uploadingVideo.id ? { ...v, status: 'uploading' } : v)
    )

    try {
      // Upload directly to Bunny
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadingVideos(prev => 
            prev.map(v => v.id === uploadingVideo.id ? { ...v, progress } : v)
          )
        }
      })
      
      xhr.addEventListener('load', () => {
        console.log('Upload response:', xhr.status, xhr.responseText)
        if (xhr.status === 200) {
          setUploadingVideos(prev => 
            prev.map(v => v.id === uploadingVideo.id ? { ...v, status: 'processing', progress: 100 } : v)
          )
          
          // Poll for video processing status
          pollVideoStatus(uploadingVideo.bunnyId, uploadingVideo.id)
          
          queryClient.invalidateQueries({ queryKey: ['course', courseId] })
        } else {
          console.error('Upload failed:', xhr.status, xhr.responseText)
          setUploadingVideos(prev => 
            prev.map(v => v.id === uploadingVideo.id ? { ...v, status: 'error', error: `HTTP ${xhr.status}` } : v)
          )
        }
      })
      
      xhr.addEventListener('error', (e) => {
        console.error('Upload network error:', e)
        setUploadingVideos(prev => 
          prev.map(v => v.id === uploadingVideo.id ? { ...v, status: 'error', error: 'Network error' } : v)
        )
      })

      xhr.open('PUT', uploadingVideo.uploadUrl)
      xhr.setRequestHeader('AccessKey', uploadingVideo.apiKey)
      xhr.send(file)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadingVideos(prev => 
        prev.map(v => v.id === uploadingVideo.id ? { ...v, status: 'error' } : v)
      )
    }
  }

  const pollVideoStatus = async (bunnyId: string, videoId: string) => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/bunny/videos?bunnyId=${bunnyId}`)
        if (!res.ok) return
        
        const data = await res.json()
        
        if (data.isReady) {
          setUploadingVideos(prev => 
            prev.map(v => v.id === videoId ? { ...v, status: 'done' } : v)
          )
          queryClient.invalidateQueries({ queryKey: ['course', courseId] })
        } else {
          // Check again in 5 seconds
          setTimeout(checkStatus, 5000)
        }
      } catch (error) {
        console.error('Error checking status:', error)
      }
    }
    
    setTimeout(checkStatus, 5000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...⏳</div>
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-500">{course.app.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm ${course.published ? 'text-green-600' : 'text-gray-500'}`}>
                {course.published ? 'Published' : 'Draft'}
              </span>
              <Link
                href={`/course/${courseId}`}
                target="_blank"
                className="px-4 py-2 rounded-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200"
              >
                Preview Course
              </Link>
              <button
                onClick={() => publishMutation.mutate(!course.published)}
                disabled={course.videos.length === 0}
                className={`px-4 py-2 rounded-lg font-medium ${
                  course.published
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                }`}
              >
                {course.published ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{course.app.apiKey}</code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Videos</label>
              <p className="text-gray-900">{course.videos.length}</p>
            </div>
          </div>
        </div>

        {/* Uploading Videos */}
        {uploadingVideos.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Uploading Videos</h2>
            <div className="space-y-4">
              {uploadingVideos.map((video) => (
                <div key={video.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{video.title}</span>
                    <span className={`text-sm ${
                      video.status === 'done' ? 'text-green-600' :
                      video.status === 'error' ? 'text-red-600' :
                      video.status === 'processing' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {video.status === 'done' ? '✓ Ready' :
                       video.status === 'error' ? `✗ Failed ${(video as any).error || ''}` :
                       video.status === 'processing' ? 'Processing...' :
                       `${video.progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        video.status === 'done' ? 'bg-green-500' :
                        video.status === 'error' ? 'bg-red-500' :
                        'bg-blue-600'
                      }`}
                      style={{ width: `${video.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Videos</h2>
            <button
              onClick={() => setShowAddVideo(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add Video
            </button>
          </div>

          {showAddVideo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4">Add New Video</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video Title *</label>
                  <input
                    type="text"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Introduction to Marketing"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddVideo(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateVideo}
                    disabled={createVideoMutation.isPending || !newVideoTitle}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createVideoMutation.isPending ? 'Creating...' : 'Create & Upload'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {course.videos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No videos yet. Add your first video above.⬆️</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={course.videos.map(v => v.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {course.videos.map((video) => (
                    <SortableVideoItem
                      key={video.id}
                      video={video}
                      onDelete={(id) => deleteVideoMutation.mutate(id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>
    </div>
  )
}
