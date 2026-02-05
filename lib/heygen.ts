// HeyGen API integration for AI avatar video generation
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY
const HEYGEN_BASE_URL = 'https://api.heygen.com/v2'

// Validate API key is configured
function getApiKey(): string {
  if (!HEYGEN_API_KEY) {
    throw new Error('HEYGEN_API_KEY environment variable is not set')
  }
  return HEYGEN_API_KEY
}

interface Avatar {
  avatar_id: string
  avatar_name: string
  gender: string
  preview_image_url: string
  preview_video_url?: string
}

interface Voice {
  voice_id: string
  name: string
  language: string
  gender: string
  preview_audio?: string
}

interface GenerateVideoInput {
  avatar_id: string
  voice_id: string
  script: string
  background?: {
    type: 'color' | 'image' | 'video'
    value: string
  }
  dimension?: {
    width: number
    height: number
  }
}

interface VideoStatus {
  video_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  video_url?: string
  thumbnail_url?: string
  duration?: number
  error?: string
}

// Fetch available avatars
export async function listAvatars(): Promise<Avatar[]> {
  const res = await fetch(`${HEYGEN_BASE_URL}/avatars`, {
    headers: {
      'X-Api-Key': getApiKey(),
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch avatars: ${res.status}`)
  }

  const data = await res.json()
  return data.data.avatars
}

// Fetch available voices
export async function listVoices(): Promise<Voice[]> {
  const res = await fetch(`${HEYGEN_BASE_URL}/voices`, {
    headers: {
      'X-Api-Key': getApiKey(),
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch voices: ${res.status}`)
  }

  const data = await res.json()
  return data.data.voices
}

// Generate avatar video
export async function generateVideo(input: GenerateVideoInput): Promise<{ video_id: string }> {
  const res = await fetch(`${HEYGEN_BASE_URL}/video/generate`, {
    method: 'POST',
    headers: {
      'X-Api-Key': getApiKey(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: 'avatar',
          avatar_id: input.avatar_id,
          avatar_style: 'normal'
        },
        voice: {
          type: 'text',
          voice_id: input.voice_id,
          input_text: input.script,
          speed: 1.0
        },
        background: input.background || {
          type: 'color',
          value: '#ffffff'
        },
        ...input.dimension
      }],
      dimension: input.dimension || {
        width: 1920,
        height: 1080
      }
    })
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to generate video: ${res.status} - ${error}`)
  }

  const data = await res.json()
  return { video_id: data.data.video_id }
}

// Check video status
export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  const res = await fetch(`${HEYGEN_BASE_URL}/video/status?video_id=${videoId}`, {
    headers: {
      'X-Api-Key': getApiKey(),
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to get video status: ${res.status}`)
  }

  const data = await res.json()
  return {
    video_id: videoId,
    status: data.data.status,
    video_url: data.data.video_url,
    thumbnail_url: data.data.thumbnail_url,
    duration: data.data.duration,
    error: data.data.error
  }
}

// Poll until video is ready
export async function pollVideoUntilComplete(
  videoId: string,
  onProgress?: (status: VideoStatus) => void
): Promise<VideoStatus> {
  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const status = await getVideoStatus(videoId)
        onProgress?.(status)

        if (status.status === 'completed') {
          resolve(status)
        } else if (status.status === 'failed') {
          reject(new Error(`Video generation failed: ${status.error}`))
        } else {
          // Check again in 5 seconds
          setTimeout(check, 5000)
        }
      } catch (error) {
        reject(error)
      }
    }

    check()
  })
}

// Delete video
export async function deleteVideo(videoId: string): Promise<void> {
  const res = await fetch(`${HEYGEN_BASE_URL}/video/${videoId}`, {
    method: 'DELETE',
    headers: {
      'X-Api-Key': getApiKey(),
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to delete video: ${res.status}`)
  }
}
