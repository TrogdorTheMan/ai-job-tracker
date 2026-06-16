// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, useCallback, useRef } from 'react'
import type { JobSearchResult, SearchResponse } from '@/types/search'

interface SearchParams {
  q: string
  location: string
  remote: boolean
  sources?: string[]
}

export function useJobSearch() {
  const [results, setResults] = useState<JobSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<SearchResponse['_meta'] | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const search = useCallback(async ({ q, location, remote, sources }: SearchParams) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ q, location, remote: String(remote) })
      if (sources?.length) params.set('sources', sources.join(','))

      const res = await fetch(`/api/search?${params}`, { signal: controller.signal })
      if (!res.ok) throw new Error(`Search failed (${res.status})`)

      const data: SearchResponse = await res.json()
      setResults(data.results)
      setMeta(data._meta)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError('Search failed. Please try again.')
      setResults([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setResults([])
    setError(null)
    setMeta(null)
  }, [])

  return { results, loading, error, meta, search, reset }
}
