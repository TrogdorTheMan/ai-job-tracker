// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, useRef } from 'react'
import { useResumes } from '@/hooks/useResumes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Resume } from '@/types/resume'

interface ResumeFormProps {
  initial?: Pick<Resume, 'name' | 'resumeText'>
  saving: boolean
  onSave: (name: string, resumeText: string) => Promise<void>
  onCancel: () => void
}

function ResumeForm({ initial, saving, onSave, onCancel }: ResumeFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [resumeText, setResumeText] = useState(initial?.resumeText ?? '')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setParsing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/resume/parse', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Parse failed')
      setResumeText(data.resumeText)
      if (!name && file.name) {
        setName(file.name.replace(/\.(pdf|docx)$/i, ''))
      }
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Could not parse file.')
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-md border border-border p-4 space-y-4 bg-muted/30">
      <div className="space-y-1.5">
        <Label htmlFor="resume-name">Resume name</Label>
        <Input
          id="resume-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Senior Engineer v2, Product Manager"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Resume text</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={parsing}
            onClick={() => fileInputRef.current?.click()}
          >
            {parsing ? 'Extracting…' : 'Upload .pdf or .docx'}
          </Button>
          <span className="text-xs text-muted-foreground">or paste below</span>
        </div>
        {parseError && <p className="text-sm text-destructive">{parseError}</p>}
        <Textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text here. Plain text works best."
          rows={14}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          disabled={saving || !name.trim() || !resumeText.trim()}
          onClick={() => onSave(name.trim(), resumeText.trim())}
        >
          {saving ? 'Saving…' : 'Save resume'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

interface ResumeCardProps {
  resume: Resume
  onEdit: () => void
  onDelete: () => void
}

function ResumeCard({ resume, onEdit, onDelete }: ResumeCardProps) {
  return (
    <div className="rounded-md border border-border p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="font-medium truncate">{resume.name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {resume.hasEmbedding ? (
              <Badge variant="secondary" className="text-xs">Embedded ✓</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Not embedded</Badge>
            )}
            {!resume.aiConfigured && (
              <span className="text-xs text-muted-foreground">AI not configured</span>
            )}
            <span className="text-xs text-muted-foreground">
              Updated {new Date(resume.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { resumes, loading, error, createResume, updateResume, deleteResume } = useResumes()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleCreate(name: string, resumeText: string) {
    setSaving(true)
    const created = await createResume(name, resumeText)
    setSaving(false)
    if (created) setShowAdd(false)
  }

  async function handleUpdate(id: string, name: string, resumeText: string) {
    setSaving(true)
    const updated = await updateResume(id, name, resumeText)
    setSaving(false)
    if (updated) setEditingId(null)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await deleteResume(id)
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Resume Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Store named resumes used to score job fit. Each application can use a different resume.
          </p>
        </div>
        {!showAdd && (
          <Button
            type="button"
            onClick={() => { setShowAdd(true); setEditingId(null) }}
          >
            Add resume
          </Button>
        )}
      </div>

      <Separator />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-4">
        {showAdd && (
          <ResumeForm
            saving={saving}
            onSave={handleCreate}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {resumes.length === 0 && !showAdd && (
          <p className="text-sm text-muted-foreground">
            No resumes yet. Click "Add resume" to get started.
          </p>
        )}

        {resumes.map((resume) =>
          editingId === resume.id ? (
            <ResumeForm
              key={resume.id}
              initial={{ name: resume.name, resumeText: resume.resumeText }}
              saving={saving}
              onSave={(name, resumeText) => handleUpdate(resume.id, name, resumeText)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onEdit={() => { setEditingId(resume.id); setShowAdd(false) }}
              onDelete={() => handleDelete(resume.id, resume.name)}
            />
          )
        )}
      </div>
    </div>
  )
}
