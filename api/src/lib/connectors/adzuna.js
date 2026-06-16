// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/us/search/1'

class AdzunaError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AdzunaError'
  }
}

function formatSalary(min, max) {
  if (!min && !max) return undefined
  const fmt = (n) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  if (min && max) return `${fmt(min)}–${fmt(max)}`
  if (min) return `${fmt(min)}+`
  return `up to ${fmt(max)}`
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

// Best-effort: Adzuna v1 has no reliable remote boolean field.
// We check title and description for "remote" keyword.
function inferRemote(title, description) {
  const haystack = `${title} ${description}`.toLowerCase()
  return haystack.includes('remote') || haystack.includes('work from home') || haystack.includes('wfh')
}

async function search({ q, location, remote, resultsPerPage = 20 }) {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) throw new AdzunaError('Adzuna credentials not configured')

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(resultsPerPage),
    what: remote ? `${q} remote`.trim() : q,
    ...(location && { where: location }),
  })

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) throw new AdzunaError(`Adzuna API error: ${res.status}`)

  const data = await res.json()
  const results = data.results ?? []

  return results.map((r) => {
    const description = stripTags(r.description ?? '')
    return {
      sourceId: `adzuna-${r.id}`,
      source: 'adzuna',
      title: r.title ?? '',
      company: r.company?.display_name ?? '',
      location: r.location?.display_name ?? '',
      remote: inferRemote(r.title ?? '', description),
      url: r.redirect_url ?? '',
      snippet: description.slice(0, 300),
      postedAt: r.created ?? undefined,
      salary: formatSalary(r.salary_min, r.salary_max),
    }
  })
}

module.exports = { search }
