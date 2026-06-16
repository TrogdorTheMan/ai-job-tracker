// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { STATUS_ORDER, STATUS_LABELS } from '@/types/job'
import type { ApplicationStatus, JobApplication } from '@/types/job'

interface FormState {
  company: string
  role: string
  url: string
  location: string
  remote: boolean
  status: ApplicationStatus
  appliedDate: string
  followUpDate: string
  nextAction: string
  notes: string
  jobDescriptionText: string
}

const defaults: FormState = {
  company: '',
  role: '',
  url: '',
  location: '',
  remote: false,
  status: 'saved',
  appliedDate: '',
  followUpDate: '',
  nextAction: '',
  notes: '',
  jobDescriptionText: '',
}

function appToFormState(app: JobApplication): FormState {
  return {
    company: app.company,
    role: app.role,
    url: app.url ?? '',
    location: app.location ?? '',
    remote: app.remote ?? false,
    status: app.status,
    appliedDate: app.appliedDate ?? '',
    followUpDate: app.followUpDate ?? '',
    nextAction: app.nextAction ?? '',
    notes: app.notes,
    jobDescriptionText: app.jobDescriptionText ?? '',
  }
}

function formStateToPayload(f: FormState) {
  return {
    company: f.company,
    role: f.role,
    status: f.status,
    notes: f.notes,
    contacts: [],
    ...(f.url && { url: f.url }),
    ...(f.location && { location: f.location }),
    ...(f.remote && { remote: f.remote }),
    ...(f.appliedDate && { appliedDate: f.appliedDate }),
    ...(f.followUpDate && { followUpDate: f.followUpDate }),
    ...(f.nextAction && { nextAction: f.nextAction }),
    ...(f.jobDescriptionText && { jobDescriptionText: f.jobDescriptionText }),
  }
}

export default function ApplicationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(defaults)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setForm(defaults)
      return
    }
    fetch(`/api/applications/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then((app: JobApplication) => setForm(appToFormState(app)))
      .catch(() => setLoadError('Could not load application.'))
  }, [id])

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.company.trim() || !form.role.trim()) {
      setSaveError('Company and role are required.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const payload = formStateToPayload(form)
      const res = await fetch(id ? `/api/applications/${id}` : '/api/applications', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Save failed')
      navigate('/board')
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loadError) return <p className="text-destructive text-sm">{loadError}</p>

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold mb-6">{isEdit ? 'Edit application' : 'Add job'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="Acme Corp"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role *</Label>
            <Input
              id="role"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              placeholder="Senior Engineer"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">Job posting URL</Label>
            <Input
              id="url"
              type="url"
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v as ApplicationStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Location & dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Seattle, WA"
            />
          </div>
          <div className="flex items-end gap-2 pb-0.5">
            <input
              id="remote"
              type="checkbox"
              checked={form.remote}
              onChange={(e) => set('remote', e.target.checked)}
              className="size-4 accent-primary"
            />
            <Label htmlFor="remote" className="cursor-pointer">Remote</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="appliedDate">Applied date</Label>
            <Input
              id="appliedDate"
              type="date"
              value={form.appliedDate}
              onChange={(e) => set('appliedDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="followUpDate">Follow-up date</Label>
            <Input
              id="followUpDate"
              type="date"
              value={form.followUpDate}
              onChange={(e) => set('followUpDate', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nextAction">Next action</Label>
          <Input
            id="nextAction"
            value={form.nextAction}
            onChange={(e) => set('nextAction', e.target.value)}
            placeholder="Send thank-you email, prepare for panel..."
          />
        </div>

        <Separator />

        {/* Notes & JD */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Recruiter name, referral, interview notes..."
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jd">
            Job description text
            <span className="ml-2 text-xs text-muted-foreground font-normal">optional — used for AI fit scoring later</span>
          </Label>
          <Textarea
            id="jd"
            value={form.jobDescriptionText}
            onChange={(e) => set('jobDescriptionText', e.target.value)}
            placeholder="Paste the full job description here..."
            rows={6}
          />
        </div>

        {saveError && <p className="text-sm text-destructive">{saveError}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add job'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
