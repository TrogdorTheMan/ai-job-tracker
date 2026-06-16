// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-6'

// Models that support extended thinking (adaptive mode)
const THINKING_MODELS = new Set(['claude-sonnet-4-6', 'claude-opus-4-8'])

const CLAUDE_MODELS = [
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5 — fast, economical' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 — balanced (default)' },
  { id: 'claude-opus-4-8', label: 'Opus 4.8 — most capable' },
]

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

async function score(resumeText, jdText, model) {
  const allowedIds = CLAUDE_MODELS.map((m) => m.id)
  const safeModel = allowedIds.includes(model) ? model : DEFAULT_MODEL
  const useThinking = THINKING_MODELS.has(safeModel)

  const userMessage = `Compare this resume against the job description and return ONLY a raw JSON object (no markdown, no explanation):

{"fitScore": <0.0-1.0>, "fitSummary": "<one sentence, max 120 chars>", "fitGaps": ["<missing skill or requirement>", ...]}

- fitScore: decimal 0.0–1.0 (use the full range; 1.0 = near-perfect match)
- fitSummary: one sentence describing the overall fit
- fitGaps: up to 8 specific skills or requirements the resume lacks (short noun phrases)

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}`

  const requestBody = {
    model: safeModel,
    max_tokens: useThinking ? 8192 : 1024,
    system:
      'You are an expert resume screener. Analyze candidate fit against a job description. ' +
      'Always respond with a single JSON object and nothing else — no markdown fences, no explanation.',
    messages: [{ role: 'user', content: userMessage }],
    ...(useThinking && {
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
    }),
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Claude API ${response.status}: ${errText}`)
  }

  const data = await response.json()

  // content may contain thinking blocks; find the text block
  const textBlock = data.content?.find((b) => b.type === 'text')
  if (!textBlock) throw new Error('No text block in Claude response')

  // extract the first JSON object from the text (handles accidental preamble)
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON object in Claude response')

  const parsed = JSON.parse(jsonMatch[0])
  const fitScore = Math.min(1, Math.max(0, Number(parsed.fitScore) || 0))
  const fitSummary = String(parsed.fitSummary || '').slice(0, 200)
  const fitGaps = Array.isArray(parsed.fitGaps)
    ? parsed.fitGaps.slice(0, 10).map(String)
    : []

  return { fitScore, fitSummary, fitGaps }
}

module.exports = { isConfigured, score, CLAUDE_MODELS, DEFAULT_MODEL }
