// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, useEffect, useCallback } from 'react'
import type { UserProfile } from '@/types/profile'

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) throw new Error('Failed to load profile')
      const data = await res.json()
      setProfile(data)
    } catch {
      setError('Could not load profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function save(resumeText: string): Promise<UserProfile | null> {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      })
      if (!res.ok) throw new Error('Failed to save profile')
      const data: UserProfile = await res.json()
      setProfile(data)
      return data
    } catch {
      setError('Could not save profile.')
      return null
    } finally {
      setSaving(false)
    }
  }

  return { profile, loading, saving, error, save, reload: load }
}
