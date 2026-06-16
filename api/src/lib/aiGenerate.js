// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-6'
const CLAUDE_MODEL_ALLOWLIST = new Set(['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-8'])

function isAzureChatConfigured() {
  return Boolean(
    process.env.AZURE_OPENAI_ENDPOINT &&
    process.env.AZURE_OPENAI_KEY &&
    process.env.AZURE_OPENAI_CHAT_DEPLOYMENT
  )
}

function isClaudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

function isConfigured() {
  return isAzureChatConfigured() || isClaudeConfigured()
}

function extractJson(text) {
  const start = text.search(/[[\{]/)
  if (start === -1) throw new Error('No JSON found in generation response')
  const sub = text.slice(start)
  const isArray = sub[0] === '['
  const close = isArray ? ']' : '}'
  const end = sub.lastIndexOf(close)
  if (end === -1) throw new Error('No JSON found in generation response')
  return JSON.parse(sub.slice(0, end + 1))
}

async function callAzureChat(messages) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, '')
  const deployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-10-21`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.AZURE_OPENAI_KEY,
    },
    body: JSON.stringify({ messages, max_tokens: 4096 }),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Azure Chat API ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

async function callClaude(system, userMessage, model) {
  const safeModel = CLAUDE_MODEL_ALLOWLIST.has(model) ? model : DEFAULT_CLAUDE_MODEL

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: safeModel,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API ${res.status}: ${err}`)
  }

  const data = await res.json()
  const textBlock = data.content?.find((b) => b.type === 'text')
  if (!textBlock) throw new Error('No text block in Claude generation response')
  return textBlock.text
}

async function callAi(system, userMessage, model) {
  if (isAzureChatConfigured()) {
    return callAzureChat([
      { role: 'system', content: system },
      { role: 'user', content: userMessage },
    ])
  }
  if (isClaudeConfigured()) {
    return callClaude(system, userMessage, model)
  }
  throw new Error('No AI provider configured for generation')
}

async function tailorResume(resumeText, jdText, model) {
  const system =
    'You are a professional resume coach. Suggest targeted improvements to make a resume better match ' +
    'a specific job description. Return ONLY a valid JSON array — no explanation, no markdown.'

  const userMessage = `Return a JSON array of up to 8 tailoring suggestions:
[{"original":"<exact phrase from resume>","suggested":"<improved version>","reason":"<why it helps>"}]

Rules:
- Only suggest changes to existing content — do not invent experience
- Focus on wording, keyword alignment, and quantified impact
- Return ONLY the JSON array, nothing else

RESUME:
${resumeText.slice(0, 8000)}

JOB DESCRIPTION:
${jdText.slice(0, 4000)}`

  const text = await callAi(system, userMessage, model)
  const parsed = extractJson(text)

  if (!Array.isArray(parsed)) throw new Error('Expected array from tailoring response')

  const suggestions = parsed.slice(0, 8).map((s) => ({
    original: String(s.original || ''),
    suggested: String(s.suggested || ''),
    reason: String(s.reason || ''),
  }))

  return { suggestions }
}

async function draftCoverLetter(resumeText, jdText, company, role, model) {
  const system =
    'You are a professional career coach. Write tailored cover letters and recruiter outreach messages. ' +
    'Return ONLY a valid JSON object — no explanation, no markdown.'

  const userMessage = `Return a JSON object:
{"coverLetter":"...","outreach":"..."}

- Cover letter: 3–4 paragraphs, professional, specific to the role and company
- Outreach: LinkedIn DM format, max 150 words, conversational but professional
- Use only information provided — do not invent facts
- Return ONLY the JSON object, nothing else

COMPANY: ${company}
ROLE: ${role}

RESUME:
${resumeText.slice(0, 8000)}

JOB DESCRIPTION:
${jdText.slice(0, 4000)}`

  const text = await callAi(system, userMessage, model)
  const parsed = extractJson(text)

  return {
    coverLetter: String(parsed.coverLetter || ''),
    outreach: String(parsed.outreach || ''),
  }
}

module.exports = { isConfigured, isAzureChatConfigured, tailorResume, draftCoverLetter }
