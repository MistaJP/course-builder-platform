'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

interface Avatar {
  avatar_id: string
  avatar_name: string
  gender: string
  preview_image_url: string
}

interface Voice {
  voice_id: string
  name: string
  language: string
  gender: string
}

async function fetchAvatars(): Promise<Avatar[]> {
  const res = await fetch('/api/heygen?type=avatars')
  if (!res.ok) throw new Error('Failed to fetch avatars')
  const data = await res.json()
  return data.avatars
}

async function fetchVoices(): Promise<Voice[]> {
  const res = await fetch('/api/heygen?type=voices')
  if (!res.ok) throw new Error('Failed to fetch voices')
  const data = await res.json()
  return data.voices
}

async function generateVideo(avatarId: string, voiceId: string, script: string) {
  const res = await fetch('/api/heygen/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      avatar_id: avatarId,
      voice_id: voiceId,
      script,
      dimension: { width: 1920, height: 1080 }
    })
  })
  if (!res.ok) throw new Error('Failed to generate video')
  return res.json()
}

async function checkVideoStatus(videoId: string) {
  const res = await fetch(`/api/heygen?type=status&videoId=${videoId}`)
  if (!res.ok) throw new Error('Failed to check status')
  return res.json()
}

export default function HeyGenTestPage() {
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('')
  const [script, setScript] = useState('')
  const [generating, setGenerating] = useState(false)
  const [videoId, setVideoId] = useState('')
  const [videoStatus, setVideoStatus] = useState<any>(null)
  const [polling, setPolling] = useState(false)

  const { data: avatars, isLoading: loadingAvatars } = useQuery({
    queryKey: ['heygen-avatars'],
    queryFn: fetchAvatars
  })

  const { data: voices, isLoading: loadingVoices } = useQuery({
    queryKey: ['heygen-voices'],
    queryFn: fetchVoices
  })

  useEffect(() => {
    if (!videoId || !polling) return

    const interval = setInterval(async () => {
      try {
        const status = await checkVideoStatus(videoId)
        setVideoStatus(status)
        
        if (status.status === 'completed' || status.status === 'failed') {
          setPolling(false)
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Error checking status:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [videoId, polling])

  const handleGenerate = async () => {
    if (!selectedAvatar || !selectedVoice || !script) return
    
    setGenerating(true)
    try {
      const result = await generateVideo(selectedAvatar, selectedVoice, script)
      setVideoId(result.video_id)
      setPolling(true)
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate video: ' + (error as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">HeyGen API Test</h1>

        {/* Avatars */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Select Avatar</h2>
          {loadingAvatars ? (
            <p className="text-gray-500">Loading avatars...⏳</p>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
              {avatars?.map((avatar) => (
                <button
                  key={avatar.avatar_id}
                  onClick={() => setSelectedAvatar(avatar.avatar_id)}
                  className={`p-2 rounded-lg border-2 text-left transition-all ${
                    selectedAvatar === avatar.avatar_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={avatar.preview_image_url}
                    alt={avatar.avatar_name}
                    className="w-full aspect-square object-cover rounded mb-2"
                  />
                  <p className="text-xs font-medium truncate">{avatar.avatar_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{avatar.gender}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voices */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Select Voice</h2>
          {loadingVoices ? (
            <p className="text-gray-500">Loading voices...⏳</p>
          ) : (
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a voice...</option>
              {voices?.map((voice) => (
                <option key={voice.voice_id} value={voice.voice_id}>
                  {voice.name} ({voice.language}) - {voice.gender}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Script */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Enter Script</h2>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Enter your video script here... (max 5000 characters)"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            maxLength={5000}
          />
          <p className="text-sm text-gray-500 mt-2">{script.length} / 5000 characters</p>
        </div>

        {/* Generate */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <button
            onClick={handleGenerate}
            disabled={!selectedAvatar || !selectedVoice || !script || generating || polling}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Starting Generation...' : 
             polling ? 'Generating Video...' : 'Generate Video'}
          </button>
        </div>

        {/* Status */}
        {videoStatus && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Status</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Video ID:</span> {videoId}</p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className={`
                  ${videoStatus.status === 'completed' ? 'text-green-600' : ''}
                  ${videoStatus.status === 'failed' ? 'text-red-600' : ''}
                  ${videoStatus.status === 'processing' ? 'text-blue-600' : ''}
                `}>
                  {videoStatus.status}
                </span>
              </p>
              
              {videoStatus.video_url && (
                <div className="mt-4">
                  <video
                    src={videoStatus.video_url}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '400px' }}
                  />
                  <a
                    href={videoStatus.video_url}
                    download
                    className="inline-block mt-2 text-blue-600 hover:underline"
                  >
                    Download Video
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
