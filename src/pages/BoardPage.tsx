// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useApplications } from '@/hooks/useApplications'
import { STATUS_ORDER, STATUS_LABELS } from '@/types/job'
import type { ApplicationStatus, JobApplication } from '@/types/job'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: 'bg-slate-100 border-slate-200',
  applied: 'bg-blue-50 border-blue-100',
  'phone-screen': 'bg-violet-50 border-violet-100',
  interview: 'bg-amber-50 border-amber-100',
  offer: 'bg-green-50 border-green-100',
  rejected: 'bg-red-50 border-red-100',
  ghosted: 'bg-zinc-50 border-zinc-200',
  withdrawn: 'bg-zinc-50 border-zinc-200',
}

function ApplicationCard({
  app,
  onDelete,
}: {
  app: JobApplication
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Delete "${app.company} — ${app.role}"?`)) {
      onDelete(app.id)
    }
  }

  return (
    <Card
      onClick={() => navigate(`/applications/${app.id}/edit`)}
      className="cursor-pointer hover:shadow-sm transition-shadow group"
    >
      <CardHeader className="p-3 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{app.company}</CardTitle>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{app.role}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {app.url && (
              <Button
                variant="ghost"
                size="icon-xs"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={app.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3" />
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon-xs" onClick={handleDelete}>
              <Trash2 className="size-3 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {(app.location ?? app.appliedDate) && (
        <CardContent className="p-3 pt-1">
          {app.location && (
            <p className="text-xs text-muted-foreground">{app.location}{app.remote ? ' · Remote' : ''}</p>
          )}
          {app.appliedDate && (
            <p className="text-xs text-muted-foreground">
              Applied {new Date(app.appliedDate).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default function BoardPage() {
  const { applications, loading, error, refresh } = useApplications()

  const byStatus = useMemo(
    () =>
      STATUS_ORDER.reduce(
        (acc, status) => {
          acc[status] = applications.filter((a) => a.status === status)
          return acc
        },
        {} as Record<ApplicationStatus, JobApplication[]>
      ),
    [applications]
  )

  async function handleDelete(id: string) {
    await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    refresh()
  }

  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>
  if (error) return <p className="text-destructive text-sm">Error: {error}</p>

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {STATUS_ORDER.map((status) => {
          const cards = byStatus[status]
          return (
            <div key={status} className="w-64 shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {STATUS_LABELS[status]}
                </span>
                {cards.length > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {cards.length}
                  </Badge>
                )}
              </div>
              <div className={cn('rounded-lg border p-2 min-h-24 flex flex-col gap-2', STATUS_COLORS[status])}>
                {cards.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">—</p>
                ) : (
                  cards.map((app) => (
                    <ApplicationCard key={app.id} app={app} onDelete={handleDelete} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
