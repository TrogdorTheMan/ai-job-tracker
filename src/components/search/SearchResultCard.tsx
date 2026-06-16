// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { JobSearchResult } from '@/types/search'

const SOURCE_LABELS: Record<string, string> = {
  adzuna: 'Adzuna',
  usajobs: 'USAJobs',
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

interface SearchResultCardProps {
  result: JobSearchResult
  onSave: (result: JobSearchResult) => void
  isDuplicate: boolean
}

export function SearchResultCard({ result, onSave, isDuplicate }: SearchResultCardProps) {
  const [expanded, setExpanded] = useState(false)
  const snippet = result.snippet ?? ''
  const isLong = snippet.length > 200

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-semibold text-sm leading-snug">{result.title}</span>
              {result.remote && (
                <Badge variant="secondary" className="text-xs">Remote</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {result.company}
              {result.location && ` · ${result.location}`}
            </p>
          </div>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
            title="Open posting"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-1">
          <Badge variant="outline" className="text-xs font-normal">
            {SOURCE_LABELS[result.source] ?? result.source}
          </Badge>
          {result.salary && (
            <span className="text-xs text-muted-foreground">{result.salary}</span>
          )}
          {result.postedAt && (
            <span className="text-xs text-muted-foreground">{relativeDate(result.postedAt)}</span>
          )}
        </div>
      </CardHeader>

      {snippet && (
        <CardContent className="pt-0 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {expanded || !isLong ? snippet : `${snippet.slice(0, 200)}…`}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-primary mt-1 hover:underline"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </CardContent>
      )}

      <div className="flex items-center gap-2 px-6 pb-4">
        <Button size="sm" onClick={() => onSave(result)}>
          Save to Tracker
        </Button>
        {isDuplicate && (
          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
            Already in tracker
          </Badge>
        )}
      </div>
    </Card>
  )
}
