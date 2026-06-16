// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const STOP_WORDS = new Set([
  'the','and','for','are','but','not','you','all','can','her','was','one','our',
  'out','day','get','has','him','his','how','its','may','new','now','old','see',
  'two','way','who','boy','did','its','let','put','say','she','too','use','will',
  'with','that','this','have','from','they','been','were','your','what','when',
  'than','then','some','also','into','more','over','such','just','each','most',
  'other','their','there','these','those','which','about','after','would','could',
  'should','being','doing','having','making','taking','using','working',
])

function cosine(a, b) {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9#+.\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
}

function extractGaps(jdText, resumeText) {
  const jdTokens = new Set(tokenize(jdText))
  const resumeTokens = new Set(tokenize(resumeText))
  const gaps = []
  for (const token of jdTokens) {
    if (!resumeTokens.has(token)) gaps.push(token)
  }
  // Return up to 20 gaps, sorted by length desc (longer = more specific/meaningful)
  return gaps.sort((a, b) => b.length - a.length).slice(0, 20)
}

function score(resumeEmbedding, jdEmbedding, resumeText, jdText) {
  const similarity = cosine(resumeEmbedding, jdEmbedding)
  const fitScore = Math.round(similarity * 100) / 100
  const fitGaps = extractGaps(jdText, resumeText)
  const pct = Math.round(fitScore * 100)
  const fitSummary = `${pct}% match · ${fitGaps.length} gap${fitGaps.length !== 1 ? 's' : ''} found`
  return { fitScore, fitSummary, fitGaps }
}

module.exports = { score, cosine, extractGaps }
