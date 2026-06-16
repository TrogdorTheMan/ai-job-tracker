// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Phase = 'idle' | 'confirming' | 'loading' | 'done' | 'error'

interface GeneratePanelProps<T> {
  label: string
  estimatedTokens: number
  estimatedCost: string
  onGenerate: () => Promise<T>
  children: (result: T) => React.ReactNode
}

export function GeneratePanel<T>({
  label,
  estimatedTokens,
  estimatedCost,
  onGenerate,
  children,
}: GeneratePanelProps<T>) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setPhase('loading')
    setError(null)
    try {
      const data = await onGenerate()
      setResult(data)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.')
      setPhase('error')
    }
  }

  function reset() {
    setPhase('idle')
    setResult(null)
    setError(null)
  }

  if (phase === 'idle') {
    return (
      <Button type="button" variant="outline" onClick={() => setPhase('confirming')}>
        {label}
      </Button>
    )
  }

  if (phase === 'confirming') {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
        <p className="text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground ml-2">
            ~{estimatedTokens.toLocaleString()} tokens · estimated cost {estimatedCost}
          </span>
        </p>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={handleConfirm}>Generate</Button>
          <Button type="button" size="sm" variant="outline" onClick={reset}>Cancel</Button>
        </div>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <p className="text-sm text-muted-foreground animate-pulse">Generating…</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-2">
        <p className="text-sm text-destructive">{error}</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setPhase('confirming')}>
            Retry
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset}>Dismiss</Button>
        </div>
      </div>
    )
  }

  // done
  return (
    <div className="space-y-3">
      {result !== null && children(result)}
      <Button type="button" size="sm" variant="ghost" onClick={reset}>Dismiss</Button>
    </div>
  )
}
