// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const { app } = require('@azure/functions')

app.http('parseResume', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'resume/parse',
  handler: async (request, context) => {
    let formData
    try {
      formData = await request.formData()
    } catch {
      return { status: 400, jsonBody: { error: 'Expected multipart form data' } }
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return { status: 400, jsonBody: { error: 'No file uploaded' } }
    }

    const name = (file.name ?? '').toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())
    let resumeText = ''

    try {
      if (name.endsWith('.pdf')) {
        const pdfParse = require('pdf-parse/lib/pdf-parse')
        const result = await pdfParse(buffer)
        resumeText = result.text
      } else if (name.endsWith('.docx')) {
        const mammoth = require('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        resumeText = result.value
      } else {
        return { status: 400, jsonBody: { error: 'Only .pdf and .docx files are supported' } }
      }
    } catch (err) {
      context.error('[resumeParse] parse failed:', err.message)
      return { status: 422, jsonBody: { error: 'Could not extract text from file. Try pasting the text directly.' } }
    }

    const trimmed = resumeText.trim()
    if (!trimmed) {
      return { status: 422, jsonBody: { error: 'No text could be extracted from the file. Try pasting the text directly.' } }
    }

    return { status: 200, jsonBody: { resumeText: trimmed } }
  },
})
