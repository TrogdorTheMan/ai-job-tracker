// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const { app } = require('@azure/functions')
const { getStore } = require('../lib/storeFactory')
const { embed, isConfigured } = require('../lib/embeddings')

function getUserId(request) {
  const principal = request.headers.get('x-ms-client-principal')
  if (principal) {
    try {
      const decoded = JSON.parse(Buffer.from(principal, 'base64').toString('utf8'))
      if (decoded.userId) return decoded.userId
    } catch {
      // fall through
    }
  }
  return 'local-user'
}

app.http('getProfile', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'profile',
  handler: async (request, _context) => {
    const store = getStore()
    const profile = await store.getProfile(getUserId(request))
    if (!profile) return { status: 200, jsonBody: null }
    // Never send the embedding vector to the client — it's large and not useful in the UI
    const { resumeEmbedding: _omit, ...safe } = profile
    return { status: 200, jsonBody: { ...safe, hasEmbedding: Boolean(profile.resumeEmbedding) } }
  },
})

app.http('saveProfile', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'profile',
  handler: async (request, context) => {
    const store = getStore()
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({}))
    const resumeText = (body.resumeText ?? '').trim()

    if (!resumeText) {
      return { status: 400, jsonBody: { error: 'resumeText is required' } }
    }

    let resumeEmbedding = null
    let embeddingError = null

    if (isConfigured()) {
      try {
        resumeEmbedding = await embed(resumeText)
      } catch (err) {
        context.error('[profile] embed failed:', err.message)
        embeddingError = 'Resume saved, but AI embedding failed. Fit scores will not be available until embedding succeeds.'
      }
    }

    const profile = await store.saveProfile(userId, { resumeText, resumeEmbedding })
    const { resumeEmbedding: _omit, ...safe } = profile

    return {
      status: 200,
      jsonBody: {
        ...safe,
        hasEmbedding: Boolean(resumeEmbedding),
        aiConfigured: isConfigured(),
        ...(embeddingError && { warning: embeddingError }),
      },
    }
  },
})
