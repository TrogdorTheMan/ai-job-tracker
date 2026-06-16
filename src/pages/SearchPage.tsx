// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useJobSearch } from '@/hooks/useJobSearch'
import { useApplications } from '@/hooks/useApplications'
import { SearchResultCard } from '@/components/search/SearchResultCard'
import type { JobSearchResult, ConnectorStatus } from '@/types/search'

function SourceStatusStrip({ sources }: { sources: Record<string, ConnectorStatus> }) {
  const entries = Object.entries(sources)
  return (
    <p className="text-xs text-muted-foreground mt-2">
      {entries.map(([name, s], i) => (
        <span key={name}>
          {i > 0 && <span className="mx-2 opacity-40">|</span>}
          <span className={s.available ? '' : 'opacity-60'}>
            {name === 'adzuna' ? 'Adzuna' : 'USAJobs'}:{' '}
            {s.queried
              ? `${s.resultCount} result${s.resultCount !== 1 ? 's' : ''}${s.error ? ' (error)' : ''}`
              : s.available
              ? 'not queried'
              : 'unavailable — no API key'}
          </span>
        </span>
      ))}
      {' · '}
      <span className="opacity-60">USAJobs returns US federal government jobs only</span>
    </p>
  )
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [location, setLocation] = useState('')
  const [remote, setRemote] = useState(false)
  const [qError, setQError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const { results, loading, error, meta, search } = useJobSearch()
  const { applications } = useApplications()

  const trackedUrls = new Set(applications.map((a) => (a.url ?? '').toLowerCase().replace(/\/+$/, '')))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!q.trim()) {
      setQError('Please enter keywords to search.')
      return
    }
    setQError(null)
    setHasSearched(true)
    search({ q: q.trim(), location: location.trim(), remote })
  }

  function handleSave(result: JobSearchResult) {
    navigate('/applications/new', { state: { prefill: result } })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold mb-6">Search Jobs</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="q">Keywords</Label>
            <Input
              id="q"
              value={q}
              onChange={(e) => { setQ(e.target.value); setQError(null) }}
              placeholder="Software engineer, product manager…"
            />
            {qError && <p className="text-xs text-destructive">{qError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Seattle, WA (leave blank for any)"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="remote"
            type="checkbox"
            checked={remote}
            onChange={(e) => setRemote(e.target.checked)}
            className="size-4 accent-primary"
          />
          <Label htmlFor="remote" className="cursor-pointer">Remote only</Label>
          <Button type="submit" disabled={loading} className="ml-auto">
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </form>

      {meta && <SourceStatusStrip sources={meta.sources} />}

      <div className="mt-6 space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && hasSearched && results.length === 0 && (
          <p className="text-sm text-muted-foreground">No results found. Try different keywords or broaden the location.</p>
        )}

        {!hasSearched && !loading && (
          <p className="text-sm text-muted-foreground">Enter keywords above to search across configured job sources.</p>
        )}

        {results.map((result) => (
          <SearchResultCard
            key={result.sourceId}
            result={result}
            onSave={handleSave}
            isDuplicate={trackedUrls.has(result.url.toLowerCase().replace(/\/+$/, ''))}
          />
        ))}
      </div>
    </div>
  )
}
