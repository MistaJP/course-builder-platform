'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

interface App {
  id: string
  name: string
  apiKey: string
  domains: string[]
  createdAt: string
  _count: {
    courses: number
  }
}

async function fetchApps(): Promise<App[]> {
  const res = await fetch('/api/apps')
  if (!res.ok) throw new Error('Failed to fetch apps')
  return res.json()
}

async function createApp(data: { name: string }) {
  const res = await fetch('/api/apps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create app')
  return res.json()
}

export default function AppsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const { data: apps, isLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: fetchApps
  })

  const createMutation = useMutation({
    mutationFn: createApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      setShowCreate(false)
      setNewAppName('')
    }
  })

  const handleCreate = () => {
    if (!newAppName) return
    createMutation.mutate({ name: newAppName })
  }

  const copyToClipboard = (text: string, appId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(appId)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...⏳</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-xl font-semibold text-gray-900">Apps</h1>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              New App
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCreate && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New App</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="App name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newAppName}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {apps?.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{app.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {app._count.courses} {app._count.courses === 1 ? 'course' : 'courses'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  API Key
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-700 overflow-x-auto">
                    {app.apiKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(app.apiKey, app.id)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    {copiedKey === app.id ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {apps?.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-lg font-medium text-gray-900 mb-2">No apps yet</h2>
            <p className="text-gray-600 mb-6">Create your first app to start building courses</p>
          </div>
        )}
      </main>
    </div>
  )
}
