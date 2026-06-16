// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, useEffect, useCallback } from 'react'
import type { Resume } from '@/types/resume'

export function useResumes() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/resumes')
      if (!res.ok) throw new Error('Failed to load resumes')
      setResumes(await res.json())
    } catch {
      setError('Could not load resumes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function createResume(name: string, resumeText: string): Promise<Resume | null> {
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, resumeText }),
      })
      if (!res.ok) throw new Error('Failed to create resume')
      const created: Resume = await res.json()
      setResumes((prev) => [...prev, created])
      return created
    } catch {
      return null
    }
  }

  async function updateResume(id: string, name: string, resumeText: string): Promise<Resume | null> {
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, resumeText }),
      })
      if (!res.ok) throw new Error('Failed to update resume')
      const updated: Resume = await res.json()
      setResumes((prev) => prev.map((r) => (r.id === id ? updated : r)))
      return updated
    } catch {
      return null
    }
  }

  async function deleteResume(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete resume')
      setResumes((prev) => prev.filter((r) => r.id !== id))
      return true
    } catch {
      return false
    }
  }

  return { resumes, loading, error, reload: load, createResume, updateResume, deleteResume }
}
