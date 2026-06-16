// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const { app } = require('@azure/functions')
const crypto = require('crypto')
const { getStore } = require('../lib/storeFactory')
const { embed, isConfigured: isAzureConfigured } = require('../lib/embeddings')
const claudeAI = require('../lib/claudeAI')
const aiGenerate = require('../lib/aiGenerate')

function getAiProvider() {
  if (isAzureConfigured()) return 'azure'
  if (claudeAI.isConfigured()) return 'claude'
  return null
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

function safeResume(resume) {
  const { resumeEmbedding: _omit, ...safe } = resume
  const provider = getAiProvider()
  return {
    ...safe,
    hasEmbedding: Boolean(resume.resumeEmbedding),
    aiConfigured: provider !== null,
    aiProvider: provider,
    generationConfigured: aiGenerate.isConfigured(),
  }
}

app.http('listResumes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'resumes',
  handler: async (request, _context) => {
    const store = getStore()
    const resumes = await store.listResumes(getUserId(request))
    const provider = getAiProvider()
    const genConfigured = aiGenerate.isConfigured()
    return {
      status: 200,
      jsonBody: resumes.map((r) => ({
        ...r,
        aiConfigured: provider !== null,
        aiProvider: provider,
        generationConfigured: genConfigured,
      })),
    }
  },
})

app.http('createResume', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'resumes',
  handler: async (request, context) => {
    const store = getStore()
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({}))
    const name = (body.name ?? '').trim() || 'Untitled'
    const resumeText = (body.resumeText ?? '').trim()

    if (!resumeText) {
      return { status: 400, jsonBody: { error: 'resumeText is required' } }
    }

    const resumeId = crypto.randomUUID()
    let resumeEmbedding = null
    let embeddingError = null

    if (isAzureConfigured()) {
      try {
        resumeEmbedding = await embed(resumeText)
      } catch (err) {
        context.error('[resumes] embed failed:', err.message)
        embeddingError = 'Resume saved, but embedding failed. Fit scores will not be available until re-saved.'
      }
    }

    const resume = await store.saveResume(userId, resumeId, { name, resumeText, resumeEmbedding })
    return {
      status: 201,
      jsonBody: {
        ...safeResume(resume),
        ...(embeddingError && { warning: embeddingError }),
      },
    }
  },
})

app.http('getResume', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'resumes/{id}',
  handler: async (request, _context) => {
    const store = getStore()
    const resume = await store.getResume(getUserId(request), request.params.id)
    if (!resume) return { status: 404, jsonBody: { error: 'Not found' } }
    return { status: 200, jsonBody: safeResume(resume) }
  },
})

app.http('updateResume', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'resumes/{id}',
  handler: async (request, context) => {
    const store = getStore()
    const userId = getUserId(request)
    const resumeId = request.params.id
    const body = await request.json().catch(() => ({}))

    const existing = await store.getResume(userId, resumeId)
    if (!existing) return { status: 404, jsonBody: { error: 'Not found' } }

    const name = (body.name ?? existing.name ?? '').trim() || 'Untitled'
    const resumeText = (body.resumeText ?? existing.resumeText ?? '').trim()

    if (!resumeText) {
      return { status: 400, jsonBody: { error: 'resumeText is required' } }
    }

    const textChanged = resumeText !== existing.resumeText
    let resumeEmbedding = textChanged ? null : existing.resumeEmbedding
    let embeddingError = null

    if (textChanged && isAzureConfigured()) {
      try {
        resumeEmbedding = await embed(resumeText)
      } catch (err) {
        context.error('[resumes] embed failed:', err.message)
        embeddingError = 'Resume saved, but embedding failed. Fit scores will not be available until re-saved.'
      }
    }

    const resume = await store.saveResume(userId, resumeId, { name, resumeText, resumeEmbedding })
    return {
      status: 200,
      jsonBody: {
        ...safeResume(resume),
        ...(embeddingError && { warning: embeddingError }),
      },
    }
  },
})

app.http('deleteResume', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'resumes/{id}',
  handler: async (request, _context) => {
    const store = getStore()
    await store.deleteResume(getUserId(request), request.params.id)
    return { status: 204 }
  },
})
