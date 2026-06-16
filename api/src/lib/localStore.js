// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DATA_DIR = path.join(process.cwd(), '.data')
const DATA_FILE = path.join(DATA_DIR, 'applications.json')
const RESUMES_FILE = path.join(DATA_DIR, 'resumes.json')

function readStore() {
  if (!fs.existsSync(DATA_FILE)) return {}
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

function writeStore(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function userApps(store, userId) {
  return store[userId] ?? []
}

const localStore = {
  async listApplications(userId) {
    return userApps(readStore(), userId)
  },

  async getApplication(userId, id) {
    return userApps(readStore(), userId).find((a) => a.id === id) ?? null
  },

  async createApplication(userId, data) {
    const store = readStore()
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
    store[userId] = [...userApps(store, userId), app]
    writeStore(store)
    return app
  },

  async updateApplication(userId, id, data) {
    const store = readStore()
    const apps = userApps(store, userId)
    const idx = apps.findIndex((a) => a.id === id)
    if (idx === -1) throw new Error(`Application ${id} not found`)
    const now = new Date().toISOString()
    const updated = { ...apps[idx], ...data, updatedAt: now }
    apps[idx] = updated
    store[userId] = apps
    writeStore(store)
    return updated
  },

  async deleteApplication(userId, id) {
    const store = readStore()
    store[userId] = userApps(store, userId).filter((a) => a.id !== id)
    writeStore(store)
  },

  async listResumes(userId) {
    if (!fs.existsSync(RESUMES_FILE)) return []
    const store = JSON.parse(fs.readFileSync(RESUMES_FILE, 'utf8'))
    const userResumes = store[userId] ?? {}
    return Object.values(userResumes).map(({ resumeEmbedding: _omit, ...r }) => r)
  },

  async getResume(userId, resumeId) {
    if (!fs.existsSync(RESUMES_FILE)) return null
    const store = JSON.parse(fs.readFileSync(RESUMES_FILE, 'utf8'))
    return store[userId]?.[resumeId] ?? null
  },

  async saveResume(userId, resumeId, data) {
    const store = fs.existsSync(RESUMES_FILE)
      ? JSON.parse(fs.readFileSync(RESUMES_FILE, 'utf8'))
      : {}
    const now = new Date().toISOString()
    if (!store[userId]) store[userId] = {}
    const existing = store[userId][resumeId] ?? {}
    store[userId][resumeId] = {
      ...existing,
      ...data,
      id: resumeId,
      userId,
      updatedAt: now,
      createdAt: existing.createdAt ?? now,
    }
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(RESUMES_FILE, JSON.stringify(store, null, 2), 'utf8')
    return store[userId][resumeId]
  },

  async deleteResume(userId, resumeId) {
    if (!fs.existsSync(RESUMES_FILE)) return
    const store = JSON.parse(fs.readFileSync(RESUMES_FILE, 'utf8'))
    if (store[userId]) {
      delete store[userId][resumeId]
      fs.writeFileSync(RESUMES_FILE, JSON.stringify(store, null, 2), 'utf8')
    }
  },

  async addStatusEvent(userId, applicationId, event) {
    const store = readStore()
    const apps = userApps(store, userId)
    const idx = apps.findIndex((a) => a.id === applicationId)
    if (idx === -1) throw new Error(`Application ${applicationId} not found`)
    const newEvent = { ...event, id: crypto.randomUUID() }
    apps[idx] = {
      ...apps[idx],
      status: event.status,
      statusHistory: [...apps[idx].statusHistory, newEvent],
      updatedAt: new Date().toISOString(),
    }
    store[userId] = apps
    writeStore(store)
    return newEvent
  },
}

module.exports = { localStore }
