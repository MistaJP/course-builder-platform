export interface Course {
  id: string
  title: string
  description?: string | null
  thumbnail?: string | null
  published: boolean
  createdAt: Date
  updatedAt: Date
  appId: string
  videos: Video[]
  _count?: {
    videos: number
  }
}

export interface Video {
  id: string
  title: string
  description?: string | null
  bunnyId: string
  duration?: number | null
  order: number
  createdAt: Date
  updatedAt: Date
  courseId: string
}

export interface App {
  id: string
  name: string
  apiKey: string
  domains: string[]
  createdAt: Date
  updatedAt: Date
  courses: Course[]
}

export interface CreateCourseInput {
  title: string
  description?: string
  appId: string
}

export interface UpdateCourseInput {
  title?: string
  description?: string
  published?: boolean
  thumbnail?: string
}

export interface CreateVideoInput {
  title: string
  description?: string
  bunnyId: string
  duration?: number
  courseId: string
}

export interface UpdateVideoOrderInput {
  videos: { id: string; order: number }[]
}
