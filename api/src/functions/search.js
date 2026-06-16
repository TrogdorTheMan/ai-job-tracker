// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const { app } = require('@azure/functions')
const { getAvailableConnectors, KNOWN_SOURCES } = require('../lib/connectors')

const MAX_RESULTS = 50

function normalizeUrl(url) {
  return (url ?? '').toLowerCase().replace(/\/+$/, '')
}

app.http('search', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'search',
  handler: async (request, context) => {
    const q = request.query.get('q') ?? ''
    const location = request.query.get('location') ?? ''
    const remote = request.query.get('remote') === 'true'
    const sourcesParam = request.query.get('sources')

    if (!q.trim()) {
      return { status: 400, jsonBody: { error: 'q (keyword) is required' } }
    }

    const { connectors, status } = getAvailableConnectors()

    const requestedSources = sourcesParam
      ? sourcesParam.split(',').map((s) => s.trim()).filter(Boolean)
      : KNOWN_SOURCES

    const queryMeta = {
      q,
      location,
      remote,
      sources: requestedSources,
    }

    const sourceMeta = {}
    for (const name of KNOWN_SOURCES) {
      sourceMeta[name] = {
        ...status[name],
        queried: requestedSources.includes(name) && connectors.has(name),
        resultCount: 0,
      }
    }

    const searchPromises = requestedSources
      .filter((name) => connectors.has(name))
      .map(async (name) => {
        try {
          const results = await connectors.get(name).search({ q, location, remote })
          sourceMeta[name].resultCount = results.length
          return results
        } catch (err) {
          context.error(`[search] connector ${name} failed:`, err.message)
          sourceMeta[name].error = err.message
          return []
        }
      })

    const settled = await Promise.allSettled(searchPromises)
    const allResults = settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : []))

    // Deduplicate by normalized URL, keeping first occurrence
    const seen = new Set()
    const deduped = allResults.filter((r) => {
      const key = normalizeUrl(r.url)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Sort by postedAt desc, nulls last
    deduped.sort((a, b) => {
      if (!a.postedAt && !b.postedAt) return 0
      if (!a.postedAt) return 1
      if (!b.postedAt) return -1
      return b.postedAt.localeCompare(a.postedAt)
    })

    return {
      status: 200,
      jsonBody: {
        results: deduped.slice(0, MAX_RESULTS),
        _meta: { query: queryMeta, sources: sourceMeta },
      },
    }
  },
})
