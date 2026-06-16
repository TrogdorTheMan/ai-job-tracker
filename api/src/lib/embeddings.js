// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

function isConfigured() {
  return Boolean(
    process.env.AZURE_OPENAI_ENDPOINT &&
    process.env.AZURE_OPENAI_KEY &&
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
  )
}

async function embed(text) {
  if (!isConfigured()) return null

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, '')
  const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
  const url = `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=2024-02-01`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.AZURE_OPENAI_KEY,
    },
    body: JSON.stringify({ input: text.slice(0, 32000) }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => res.status)
    throw new Error(`Azure OpenAI embed failed: ${msg}`)
  }

  const data = await res.json()
  return data.data[0].embedding
}

module.exports = { embed, isConfigured }
