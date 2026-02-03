// Bunny.net Stream API integration
const BUNNY_API_KEY = process.env.BUNNY_API_KEY
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID
const BUNNY_BASE_URL = 'https://video.bunnycdn.com/library'

interface BunnyVideo {
  guid: string
  title: string
  dateUploaded: string
  views: number
  isPublic: boolean
  length: number
  status: number
  thumbnailFileName: string | null
}

export async function createVideo(title: string): Promise<{ guid: string; uploadUrl: string }> {
  const res = await fetch(`${BUNNY_BASE_URL}/${BUNNY_LIBRARY_ID}/videos`, {
    method: 'POST',
    headers: {
      'AccessKey': BUNNY_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Bunny API error: ${res.status} - ${error}`)
  }

  const data = await res.json()
  return {
    guid: data.guid,
    uploadUrl: `${BUNNY_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${data.guid}`
  }
}

export async function uploadVideo(videoId: string, file: Buffer, contentType?: string): Promise<void> {
  const headers: Record<string, string> = {
    'AccessKey': BUNNY_API_KEY!,
  }
  
  // Bunny needs content-type for proper processing
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const res = await fetch(`${BUNNY_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    method: 'PUT',
    headers,
    body: file
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Upload failed: ${res.status} - ${error}`)
  }
}

export async function getVideo(videoId: string): Promise<BunnyVideo> {
  const res = await fetch(`${BUNNY_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    headers: {
      'AccessKey': BUNNY_API_KEY!
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to get video: ${res.status}`)
  }

  return res.json()
}

export async function listVideos(page = 1, itemsPerPage = 100): Promise<BunnyVideo[]> {
  const res = await fetch(
    `${BUNNY_BASE_URL}/${BUNNY_LIBRARY_ID}/videos?page=${page}&itemsPerPage=${itemsPerPage}`,
    {
      headers: {
        'AccessKey': BUNNY_API_KEY!
      }
    }
  )

  if (!res.ok) {
    throw new Error(`Failed to list videos: ${res.status}`)
  }

  const data = await res.json()
  return data.items
}

export async function deleteVideo(videoId: string): Promise<void> {
  const res = await fetch(`${BUNNY_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    method: 'DELETE',
    headers: {
      'AccessKey': BUNNY_API_KEY!
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to delete video: ${res.status}`)
  }
}

export function getEmbedUrl(videoId: string): string {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}`
}

export function getThumbnailUrl(videoId: string, thumbnailName?: string): string {
  if (thumbnailName) {
    return `https://${BUNNY_LIBRARY_ID}.b-cdn.net/${videoId}/${thumbnailName}`
  }
  return `https://${BUNNY_LIBRARY_ID}.b-cdn.net/${videoId}/thumbnail.jpg`
}
