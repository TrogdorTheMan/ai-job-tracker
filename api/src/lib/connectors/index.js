// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const adzuna = require('./adzuna')
const usajobs = require('./usajobs')

const KNOWN_SOURCES = ['adzuna', 'usajobs']

// Called per-request so env changes in local dev are picked up without restart.
function getAvailableConnectors() {
  const connectors = new Map()
  const status = {}

  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    connectors.set('adzuna', adzuna)
    status.adzuna = { available: true }
  } else {
    status.adzuna = { available: false, reason: 'ADZUNA_APP_ID and ADZUNA_APP_KEY not set' }
  }

  if (process.env.USAJOBS_API_KEY) {
    connectors.set('usajobs', usajobs)
    status.usajobs = { available: true }
    if (!process.env.USAJOBS_USER_AGENT) {
      status.usajobs.warning = 'USAJOBS_USER_AGENT (your email) not set — USAJobs ToS requires it'
    }
  } else {
    status.usajobs = { available: false, reason: 'USAJOBS_API_KEY not set' }
  }

  return { connectors, status }
}

module.exports = { getAvailableConnectors, KNOWN_SOURCES }
