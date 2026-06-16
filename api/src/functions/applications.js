// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const { app } = require('@azure/functions')
const { getStore } = require('../lib/storeFactory')
const { embed, isConfigured } = require('../lib/embeddings')
const { score } = require('../lib/scoring')

async function tryScore(store, userId, body, context) {
  if (!isConfigured()) return {}
  const jdText = (body.jobDescriptionText ?? '').trim()
  if (!jdText) return {}
  try {
    const profile = await store.getProfile(userId)
    if (!profile?.resumeEmbedding) return {}
    const jdEmbedding = await embed(jdText)
    return score(profile.resumeEmbedding, jdEmbedding, profile.resumeText, jdText)
  } catch (err) {
    context.error('[applications] scoring failed:', err.message)
    return {}
  }
}

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

app.http('listApplications', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'applications',
  handler: async (request, _context) => {
    const store = getStore()
    const applications = await store.listApplications(getUserId(request))
    return { status: 200, jsonBody: applications }
  },
})

app.http('createApplication', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'applications',
  handler: async (request, context) => {
    const store = getStore()
    const userId = getUserId(request)
    const body = await request.json()
    const fitFields = await tryScore(store, userId, body, context)
    const application = await store.createApplication(userId, { ...body, ...fitFields })
    return { status: 201, jsonBody: application }
  },
})

app.http('getApplication', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'applications/{id}',
  handler: async (request, _context) => {
    const store = getStore()
    const application = await store.getApplication(getUserId(request), request.params.id)
    if (!application) return { status: 404, jsonBody: { error: 'Not found' } }
    return { status: 200, jsonBody: application }
  },
})

app.http('updateApplication', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'applications/{id}',
  handler: async (request, context) => {
    const store = getStore()
    const userId = getUserId(request)
    const body = await request.json()
    const fitFields = await tryScore(store, userId, body, context)
    try {
      const application = await store.updateApplication(userId, request.params.id, { ...body, ...fitFields })
      return { status: 200, jsonBody: application }
    } catch (e) {
      return { status: 404, jsonBody: { error: e.message } }
    }
  },
})

app.http('deleteApplication', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'applications/{id}',
  handler: async (request, _context) => {
    const store = getStore()
    await store.deleteApplication(getUserId(request), request.params.id)
    return { status: 204 }
  },
})

app.http('addStatusEvent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'applications/{id}/status',
  handler: async (request, _context) => {
    const store = getStore()
    const body = await request.json()
    try {
      const event = await store.addStatusEvent(getUserId(request), request.params.id, body)
      return { status: 201, jsonBody: event }
    } catch (e) {
      return { status: 404, jsonBody: { error: e.message } }
    }
  },
})
