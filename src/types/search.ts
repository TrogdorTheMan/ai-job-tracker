// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

export type SearchSource = 'adzuna' | 'usajobs'

export interface JobSearchResult {
  sourceId: string
  source: SearchSource
  title: string
  company: string
  location: string
  remote: boolean
  url: string
  snippet: string
  postedAt?: string
  salary?: string
}

export interface ConnectorStatus {
  available: boolean
  queried: boolean
  resultCount: number
  error?: string
  warning?: string
  reason?: string
}

export interface SearchResponse {
  results: JobSearchResult[]
  _meta: {
    query: { q: string; location: string; remote: boolean; sources: string[] }
    sources: Record<SearchSource, ConnectorStatus>
  }
}
