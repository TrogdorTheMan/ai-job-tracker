// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const BASE_URL = 'https://data.usajobs.gov/api/search'

class USAJobsError extends Error {
  constructor(message) {
    super(message)
    this.name = 'USAJobsError'
  }
}

const RATE_INTERVAL_LABELS = {
  PA: '/yr',
  PH: '/hr',
  PW: '/wk',
  PM: '/mo',
  PB: '/biweekly',
}

function formatSalary(min, max, rateCode) {
  if (!min && !max) return undefined
  const fmt = (n) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const suffix = RATE_INTERVAL_LABELS[rateCode] ?? ''
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}${suffix}`
  return `${fmt(min || max)}${suffix}`
}

async function search({ q, location, remote, resultsPerPage = 25 }) {
  const apiKey = process.env.USAJOBS_API_KEY
  const userAgent = process.env.USAJOBS_USER_AGENT
  if (!apiKey) throw new USAJobsError('USAJobs API key not configured')

  const params = new URLSearchParams({
    Keyword: q,
    ResultsPerPage: String(resultsPerPage),
    ...(location && { LocationName: location }),
    ...(remote && { RemoteIndicator: 'true' }),
  })

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: {
      Authorization: apiKey,
      Host: 'data.usajobs.gov',
      // USAJobs ToS requires the registered email as User-Agent
      'User-Agent': userAgent || 'ai-job-tracker-user@example.com',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) throw new USAJobsError(`USAJobs API error: ${res.status}`)

  const data = await res.json()
  const items = data.SearchResult?.SearchResultItems ?? []

  return items.map((item) => {
    const d = item.MatchedObjectDescriptor ?? {}
    const remuneration = d.PositionRemuneration?.[0] ?? {}
    const location0 = d.PositionLocation?.[0]?.LocationName ?? 'Various'
    const schedules = d.PositionSchedule ?? []
    const isRemote = remote || schedules.some((s) => s.Name?.toLowerCase().includes('remote'))
    const snippet = (d.UserArea?.Details?.MajorDuties?.[0] ?? '').slice(0, 300)

    return {
      sourceId: `usajobs-${d.PositionID}`,
      source: 'usajobs',
      title: d.PositionTitle ?? '',
      company: d.OrganizationName ?? '',
      location: location0,
      remote: isRemote,
      url: d.PositionURI ?? '',
      snippet,
      postedAt: d.PublicationStartDate ?? undefined,
      salary: formatSalary(remuneration.MinimumRange, remuneration.MaximumRange, remuneration.RateIntervalCode),
    }
  })
}

module.exports = { search }
