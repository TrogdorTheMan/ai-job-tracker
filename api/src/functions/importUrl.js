// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const { app } = require('@azure/functions')
const { parse } = require('htmlparser2')
const { DomHandler } = require('domhandler')
const { findAll, getText } = require('domutils')

const MAX_BODY_BYTES = 512 * 1024

// SSRF blocklist — reject requests to internal/loopback addresses
const BLOCKED_HOSTNAMES = /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1)$/i

function isBlockedHost(hostname) {
  return BLOCKED_HOSTNAMES.test(hostname)
}

function parseHtml(html) {
  return new Promise((resolve) => {
    const handler = new DomHandler((err, dom) => {
      resolve(err ? [] : dom)
    })
    const parser = parse(html, handler)
    void parser
  })
}

// Extract text from a dom node array
function domText(nodes) {
  return getText(nodes).replace(/\s+/g, ' ').trim()
}

// Find and parse all LD+JSON script blocks, return first JobPosting found
function extractLdJson(dom) {
  const scripts = findAll(
    (n) => n.type === 'script' && n.attribs?.type === 'application/ld+json',
    dom
  )
  for (const s of scripts) {
    const raw = domText([s])
    try {
      const parsed = JSON.parse(raw)
      const entries = Array.isArray(parsed) ? parsed : [parsed]
      for (const entry of entries) {
        if (entry['@type'] === 'JobPosting') return entry
      }
    } catch {
      // malformed JSON — skip
    }
  }
  return null
}

function extractTitle(dom) {
  const titles = findAll((n) => n.name === 'title', dom)
  return titles.length > 0 ? domText([titles[0]]) : ''
}

function extractMetaDescription(dom) {
  const metas = findAll(
    (n) => n.name === 'meta' && n.attribs?.name?.toLowerCase() === 'description',
    dom
  )
  return metas[0]?.attribs?.content ?? ''
}

// Find the largest semantic content block as fallback JD text
function extractMainContent(dom) {
  const candidates = findAll(
    (n) => ['main', 'article'].includes(n.name) ||
      (n.attribs?.class && /job|description|content/i.test(n.attribs.class)),
    dom
  )
  if (candidates.length === 0) return ''
  // Pick the one with the most text
  let best = ''
  for (const c of candidates) {
    const text = domText([c])
    if (text.length > best.length) best = text
  }
  return best.slice(0, 8000)
}

app.http('importUrl', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'import-url',
  handler: async (request, context) => {
    const body = await request.json().catch(() => ({}))
    const url = (body.url ?? '').trim()

    if (!url) {
      return { status: 400, jsonBody: { error: 'url is required' } }
    }

    let parsed
    try {
      parsed = new URL(url)
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid URL' } }
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { status: 400, jsonBody: { error: 'Only http and https URLs are supported' } }
    }

    if (isBlockedHost(parsed.hostname)) {
      return { status: 400, jsonBody: { error: 'That URL is not reachable from the server' } }
    }

    let html
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ai-job-tracker/1.0; +https://github.com/TrogdorTheMan/ai-job-tracker)',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(8000),
        redirect: 'follow',
      })

      if (res.status === 403 || res.status === 401) {
        return {
          status: 200,
          jsonBody: {
            _meta: { url, parsedAt: new Date().toISOString(), confidence: 'blocked', error: 'This site blocked the server-side fetch. Please paste the job details manually.' },
          },
        }
      }

      if (!res.ok) {
        return {
          status: 200,
          jsonBody: {
            _meta: { url, parsedAt: new Date().toISOString(), confidence: 'blocked', error: `Site returned ${res.status}. Please paste the job details manually.` },
          },
        }
      }

      const buffer = await res.arrayBuffer()
      html = new TextDecoder().decode(buffer.slice(0, MAX_BODY_BYTES))
    } catch (err) {
      context.error('[importUrl] fetch failed:', err.message)
      return {
        status: 200,
        jsonBody: {
          _meta: { url, parsedAt: new Date().toISOString(), confidence: 'blocked', error: 'Could not reach that URL. Please paste the job details manually.' },
        },
      }
    }

    const dom = await parseHtml(html)
    const ldJson = extractLdJson(dom)

    if (ldJson) {
      const company = ldJson.hiringOrganization?.name ?? ldJson.hiringOrganization ?? ''
      const location =
        ldJson.jobLocation?.address?.addressLocality ??
        ldJson.jobLocation?.address?.addressRegion ??
        (Array.isArray(ldJson.jobLocation)
          ? ldJson.jobLocation[0]?.address?.addressLocality
          : undefined) ??
        ''
      const remote =
        ldJson.jobLocationType === 'TELECOMMUTE' ||
        (typeof ldJson.employmentType === 'string' && ldJson.employmentType.toLowerCase().includes('remote'))

      return {
        status: 200,
        jsonBody: {
          role: ldJson.title ?? '',
          company: typeof company === 'string' ? company : '',
          location,
          remote,
          jobDescriptionText: (ldJson.description ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
          _meta: { url, parsedAt: new Date().toISOString(), confidence: 'schema-org' },
        },
      }
    }

    // Heuristic fallback
    const pageTitle = extractTitle(dom)
    const mainContent = extractMainContent(dom)

    return {
      status: 200,
      jsonBody: {
        role: pageTitle || '',
        jobDescriptionText: mainContent || extractMetaDescription(dom),
        _meta: { url, parsedAt: new Date().toISOString(), confidence: mainContent ? 'heuristic' : 'low' },
      },
    }
  },
})
