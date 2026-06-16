// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const { localStore } = require('./localStore')

function getStore() {
  const backend = process.env.DATA_BACKEND ?? 'local'

  if (backend === 'local') return localStore

  if (backend === 'azure-table') {
    const { azureTableStore } = require('./azureTableStore')
    return azureTableStore
  }

  throw new Error(`Unsupported DATA_BACKEND: "${backend}"`)
}

module.exports = { getStore }
