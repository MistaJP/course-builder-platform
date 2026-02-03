'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Video {
  id: string
  title: string
  bunnyId: string
  duration: number | null
  order: number
}

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  app: {
    id: string
    name: string
  }
  videos: Video[]
}

async function fetchCourse(id: string): Promise<Course> {
  // Use admin API for now (public API requires API key)
  const res = await fetch(`/api/courses/${id}`)
  if (!res.ok) throw new Error('Failed to fetch course')
  return res.json()
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${mins}min`
  }
  return `${mins} min`
}

export default function LearnPage() {
  const params = useParams()
  const courseId = params.id as string
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set([0])) // First lesson marked as started

  const { data: course, isLoading } = useQuery({
    queryKey: ['learn-course', courseId],
    queryFn: () => fetchCourse(courseId)
  })

  useEffect(() => {
    // Mark current lesson as completed when switching
    setCompletedLessons(prev => new Set([...prev, currentVideoIndex]))
  }, [currentVideoIndex])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading course...⏳</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Course not found</div>
      </div>
    )
  }

  const currentVideo = course.videos[currentVideoIndex]
  const progress = Math.round((completedLessons.size / course.videos.length) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={`/course/${courseId}`} className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <nav className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <span>My Course</span>
                <span>›</span>
                <span className="text-gray-900">{course.title}</span>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{completedLessons.size}/{course.videos.length} Completed</p>
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video mb-6">
              {currentVideo && (
                <iframe
                  src={`https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || 'YOUR_LIBRARY_ID'}/${currentVideo.bunnyId}`}
                  className="w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Video Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentVideo?.title}</h1>
              <p className="text-gray-600">{course.description}</p>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setCurrentVideoIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentVideoIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous Lesson
                </button>

                <button
                  onClick={() => setCurrentVideoIndex(prev => Math.min(course.videos.length - 1, prev + 1))}
                  disabled={currentVideoIndex === course.videos.length - 1}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Lesson
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* About This Course */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About This Course</h2>
              <p className="text-gray-600">
                {course.description || 'This course will guide you through everything you need to know.'}
              </p>

              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">This Course is Perfect For:</h3>
                <ul className="space-y-2 text-purple-800">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Beginners looking to learn the fundamentals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Professionals wanting to enhance their skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Anyone interested in practical, hands-on learning</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Course Outline */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-500 mb-1">Your Study Progress</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-purple-600">{progress}%</span>
                  <span className="text-sm text-gray-500">completed</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Course Content ({course.videos.length} lessons)
                </h3>
                
                {course.videos.map((video, index) => {
                  const isCompleted = completedLessons.has(index)
                  const isCurrent = index === currentVideoIndex
                  
                  return (
                    <button
                      key={video.id}
                      onClick={() => setCurrentVideoIndex(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? 'bg-purple-100 border border-purple-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isCurrent ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isCurrent ? 'text-purple-900' : 'text-gray-900'
                        }`}>
                          {video.title}
                        </p>
                        <p className="text-xs text-gray-500">{formatDuration(video.duration)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
