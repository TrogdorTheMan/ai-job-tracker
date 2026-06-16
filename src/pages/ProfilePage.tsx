// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, useEffect, useRef } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function ProfilePage() {
  const { profile, loading, saving, error, save } = useProfile()
  const [resumeText, setResumeText] = useState('')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setSaveMessage(null)
    setParsing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/resume/parse', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Parse failed')
      setResumeText(data.resumeText)
      setSaveMessage('Text extracted — review and click Save.')
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Could not parse file.')
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (profile?.resumeText) setResumeText(profile.resumeText)
  }, [profile])

  async function handleSave() {
    setSaveMessage(null)
    const result = await save(resumeText)
    if (result) {
      setSaveMessage(result.warning ?? (result.hasEmbedding ? 'Resume saved and embedded.' : 'Resume saved. Add Azure OpenAI keys to enable fit scoring.'))
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your resume is used to score job fit and highlight skill gaps. It's stored in your own storage account.
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Label htmlFor="resume">Resume text</Label>
          {profile && (
            <div className="flex items-center gap-2">
              {profile.hasEmbedding ? (
                <Badge variant="secondary">Embedded ✓</Badge>
              ) : (
                <Badge variant="outline">Not embedded</Badge>
              )}
              {!profile.aiConfigured && (
                <span className="text-xs text-muted-foreground">Azure OpenAI not configured</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
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
          <span className="text-xs text-muted-foreground">or paste text below</span>
        </div>

        {parseError && <p className="text-sm text-destructive">{parseError}</p>}

        <Textarea
          id="resume"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text here. Plain text works best — copy from a text editor or paste directly from your resume."
          rows={16}
          className="font-mono text-xs"
        />

        {profile?.updatedAt && (
          <p className="text-xs text-muted-foreground">
            Last saved {new Date(profile.updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saveMessage && <p className="text-sm text-muted-foreground">{saveMessage}</p>}

      <Button onClick={handleSave} disabled={saving || !resumeText.trim()}>
        {saving ? 'Saving…' : profile ? 'Save & re-embed' : 'Save resume'}
      </Button>
    </div>
  )
}
