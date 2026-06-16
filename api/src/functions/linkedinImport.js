// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const { app } = require('@azure/functions')
const AdmZip = require('adm-zip')

// Inline quoted-field CSV parser — handles LinkedIn's export format
function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)
  if (lines.length < 2) return []

  function parseRow(line) {
    const fields = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    return fields
  }

  const headers = parseRow(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseRow(line)
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]))
  })
}

function getEntry(zip, name) {
  const entry = zip.getEntries().find(
    (e) => e.entryName.toLowerCase().endsWith(name.toLowerCase())
  )
  return entry ? entry.getData().toString('utf8') : null
}

function formatDate(raw) {
  if (!raw) return ''
  // LinkedIn dates: "Jan 2022" or "2022-01" or "2022" — return as-is
  return raw
}

function buildProfileText(profile, positions, skills, education) {
  const lines = []

  if (profile.length > 0) {
    const p = profile[0]
    const name = [p['First Name'], p['Last Name']].filter(Boolean).join(' ')
    const headline = p['Headline'] || ''
    const summary = p['Summary'] || ''
    if (name || headline) {
      lines.push('== Profile ==')
      if (name && headline) lines.push(`${name} | ${headline}`)
      else if (name) lines.push(name)
      else lines.push(headline)
      if (summary) lines.push('', summary)
      lines.push('')
    }
  }

  if (positions.length > 0) {
    lines.push('== Work History ==')
    for (const pos of positions) {
      const title = pos['Title'] || ''
      const company = pos['Company Name'] || ''
      const location = pos['Location'] || ''
      const started = formatDate(pos['Started On'])
      const finished = formatDate(pos['Finished On'])
      const desc = pos['Description'] || ''

      const dateRange = started ? `${started} – ${finished || 'Present'}` : ''
      const header = [
        title && company ? `${title} at ${company}` : title || company,
        dateRange,
        location,
      ].filter(Boolean).join(' · ')

      lines.push(header)
      if (desc) lines.push(desc)
      lines.push('')
    }
  }

  if (skills.length > 0) {
    lines.push('== Skills ==')
    lines.push(skills.map((s) => s['Name']).filter(Boolean).join(', '))
    lines.push('')
  }

  if (education.length > 0) {
    lines.push('== Education ==')
    for (const edu of education) {
      const school = edu['School Name'] || ''
      const degree = edu['Degree Name'] || ''
      const field = edu['Field Of Study'] || ''
      const start = formatDate(edu['Start Date'])
      const end = formatDate(edu['End Date'])
      const dateRange = start ? `${start}–${end || 'Present'}` : ''
      const line = [
        [degree, field].filter(Boolean).join(' in '),
        school,
        dateRange,
      ].filter(Boolean).join(', ')
      if (line) lines.push(line)
    }
    lines.push('')
  }

  return lines.join('\n').trim()
}

app.http('importLinkedin', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'import-linkedin',
  handler: async (request, context) => {
    let formData
    try {
      formData = await request.formData()
    } catch {
      return { status: 400, jsonBody: { error: 'Expected multipart form data.' } }
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return { status: 400, jsonBody: { error: 'No file uploaded.' } }
    }

    const name = file.name ?? ''
    if (!name.toLowerCase().endsWith('.zip')) {
      return { status: 400, jsonBody: { error: 'File must be a .zip (your LinkedIn data export).' } }
    }

    let zip
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      zip = new AdmZip(buffer)
    } catch (err) {
      context.error('[linkedin-import] unzip failed:', err.message)
      return { status: 422, jsonBody: { error: 'Could not open zip file. Make sure it\'s your LinkedIn data export.' } }
    }

    const profileCsv = getEntry(zip, 'Profile.csv')
    const positionsCsv = getEntry(zip, 'Positions.csv')
    const skillsCsv = getEntry(zip, 'Skills.csv')
    const educationCsv = getEntry(zip, 'Education.csv')

    if (!profileCsv && !positionsCsv && !skillsCsv && !educationCsv) {
      return {
        status: 400,
        jsonBody: {
          error: 'No LinkedIn profile data found in this zip. Make sure you downloaded the full data export from LinkedIn (Settings → Data Privacy → Get a copy of your data).',
        },
      }
    }

    const profile = profileCsv ? parseCSV(profileCsv) : []
    const positions = positionsCsv ? parseCSV(positionsCsv) : []
    const skills = skillsCsv ? parseCSV(skillsCsv) : []
    const education = educationCsv ? parseCSV(educationCsv) : []

    const profileText = buildProfileText(profile, positions, skills, education)
    const firstName = profile[0]?.['First Name'] ?? ''
    const lastName = profile[0]?.['Last Name'] ?? ''
    const namePart = [firstName, lastName].filter(Boolean).join(' ')
    const suggestedName = namePart ? `${namePart} — LinkedIn` : 'LinkedIn Profile'

    return {
      status: 200,
      jsonBody: { profileText, suggestedName },
    }
  },
})
