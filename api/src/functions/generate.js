// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const { app } = require('@azure/functions')
const { getStore } = require('../lib/storeFactory')
const aiGenerate = require('../lib/aiGenerate')

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

async function getResumeForApp(store, userId, application) {
  if (application.resumeId) {
    const resume = await store.getResume(userId, application.resumeId)
    if (resume) return resume
  }
  const all = await store.listResumes(userId)
  if (all.length > 0) return store.getResume(userId, all[0].id)
  return null
}

app.http('generateTailoring', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'applications/{id}/generate/tailoring',
  handler: async (request, context) => {
    if (!aiGenerate.isConfigured()) {
      return { status: 503, jsonBody: { error: 'No AI provider configured for generation' } }
    }
    const store = getStore()
    const userId = getUserId(request)
    const application = await store.getApplication(userId, request.params.id)
    if (!application) return { status: 404, jsonBody: { error: 'Application not found' } }
    const jdText = (application.jobDescriptionText ?? '').trim()
    if (!jdText) return { status: 400, jsonBody: { error: 'Application has no job description text' } }
    const resume = await getResumeForApp(store, userId, application)
    if (!resume?.resumeText) return { status: 400, jsonBody: { error: 'No resume found for this application' } }

    const body = await request.json().catch(() => ({}))
    try {
      const result = await aiGenerate.tailorResume(resume.resumeText, jdText, body.claudeModel)
      return { status: 200, jsonBody: result }
    } catch (err) {
      context.error('[generate] tailoring failed:', err.message)
      return { status: 500, jsonBody: { error: 'Generation failed. Please try again.' } }
    }
  },
})

app.http('generateCoverLetter', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'applications/{id}/generate/cover-letter',
  handler: async (request, context) => {
    if (!aiGenerate.isConfigured()) {
      return { status: 503, jsonBody: { error: 'No AI provider configured for generation' } }
    }
    const store = getStore()
    const userId = getUserId(request)
    const application = await store.getApplication(userId, request.params.id)
    if (!application) return { status: 404, jsonBody: { error: 'Application not found' } }
    const jdText = (application.jobDescriptionText ?? '').trim()
    if (!jdText) return { status: 400, jsonBody: { error: 'Application has no job description text' } }
    const resume = await getResumeForApp(store, userId, application)
    if (!resume?.resumeText) return { status: 400, jsonBody: { error: 'No resume found for this application' } }

    const body = await request.json().catch(() => ({}))
    try {
      const result = await aiGenerate.draftCoverLetter(
        resume.resumeText,
        jdText,
        application.company,
        application.role,
        body.claudeModel
      )
      return { status: 200, jsonBody: result }
    } catch (err) {
      context.error('[generate] cover letter failed:', err.message)
      return { status: 500, jsonBody: { error: 'Generation failed. Please try again.' } }
    }
  },
})
