// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const { TableClient } = require('@azure/data-tables')
const crypto = require('crypto')

const TABLE_NAME = 'applications'
let _client = null

function getClient() {
  if (_client) return _client
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!conn) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set')
  _client = TableClient.fromConnectionString(conn, TABLE_NAME)
  // Create table on first use; ignore 409 (already exists)
  _client.createTable().catch((e) => {
    if (e.statusCode !== 409) throw e
  })
  return _client
}

function toEntity(userId, app) {
  return {
    partitionKey: userId,
    rowKey: app.id,
    company: app.company,
    role: app.role,
    url: app.url ?? '',
    location: app.location ?? '',
    remote: app.remote ?? false,
    status: app.status,
    appliedDate: app.appliedDate ?? '',
    followUpDate: app.followUpDate ?? '',
    nextAction: app.nextAction ?? '',
    notes: app.notes ?? '',
    jobDescriptionText: app.jobDescriptionText ?? '',
    contacts: JSON.stringify(app.contacts ?? []),
    statusHistory: JSON.stringify(app.statusHistory ?? []),
    fitScore: typeof app.fitScore === 'number' ? app.fitScore : 0,
    fitSummary: app.fitSummary ?? '',
    fitGaps: JSON.stringify(app.fitGaps ?? []),
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  }
}

function fromEntity(entity) {
  return {
    id: entity.rowKey,
    userId: entity.partitionKey,
    company: entity.company,
    role: entity.role,
    url: entity.url || undefined,
    location: entity.location || undefined,
    remote: entity.remote || false,
    status: entity.status,
    appliedDate: entity.appliedDate || undefined,
    followUpDate: entity.followUpDate || undefined,
    nextAction: entity.nextAction || undefined,
    notes: entity.notes || '',
    jobDescriptionText: entity.jobDescriptionText || undefined,
    contacts: JSON.parse(entity.contacts || '[]'),
    statusHistory: JSON.parse(entity.statusHistory || '[]'),
    fitScore: entity.fitScore || undefined,
    fitSummary: entity.fitSummary || undefined,
    fitGaps: JSON.parse(entity.fitGaps || '[]'),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  }
}

const azureTableStore = {
  async listApplications(userId) {
    const client = getClient()
    const apps = []
    const iter = client.listEntities({
      queryOptions: { filter: `PartitionKey eq '${userId}'` },
    })
    for await (const entity of iter) {
      apps.push(fromEntity(entity))
    }
    return apps
  },

  async getApplication(userId, id) {
    const client = getClient()
    try {
      const entity = await client.getEntity(userId, id)
      return fromEntity(entity)
    } catch (e) {
      if (e.statusCode === 404) return null
      throw e
    }
  },

  async createApplication(userId, data) {
    const client = getClient()
    const now = new Date().toISOString()
    const app = {
      ...data,
      id: crypto.randomUUID(),
      userId,
      contacts: data.contacts ?? [],
      notes: data.notes ?? '',
      statusHistory: [
        {
          id: crypto.randomUUID(),
          status: data.status,
          occurredAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    }
    await client.createEntity(toEntity(userId, app))
    return app
  },

  async updateApplication(userId, id, data) {
    const existing = await this.getApplication(userId, id)
    if (!existing) throw new Error(`Application ${id} not found`)
    const client = getClient()
    const now = new Date().toISOString()
    const updated = { ...existing, ...data, updatedAt: now }
    await client.updateEntity(toEntity(userId, updated), 'Replace')
    return updated
  },

  async deleteApplication(userId, id) {
    const client = getClient()
    await client.deleteEntity(userId, id)
  },

  async addStatusEvent(userId, applicationId, event) {
    const app = await this.getApplication(userId, applicationId)
    if (!app) throw new Error(`Application ${applicationId} not found`)
    const client = getClient()
    const newEvent = { ...event, id: crypto.randomUUID() }
    const updated = {
      ...app,
      status: event.status,
      statusHistory: [...app.statusHistory, newEvent],
      updatedAt: new Date().toISOString(),
    }
    await client.updateEntity(toEntity(userId, updated), 'Replace')
    return newEvent
  },
}

module.exports = { azureTableStore }
