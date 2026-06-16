// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FilterBar from '@/components/filters/FilterBar'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { Trash2, ExternalLink, GripVertical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useApplications } from '@/hooks/useApplications'
import { STATUS_ORDER, STATUS_LABELS } from '@/types/job'
import type { ApplicationStatus, JobApplication } from '@/types/job'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: 'bg-slate-100 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700',
  applied: 'bg-blue-50 border-blue-100 dark:bg-blue-950/50 dark:border-blue-900',
  'phone-screen': 'bg-violet-50 border-violet-100 dark:bg-violet-950/50 dark:border-violet-900',
  interview: 'bg-amber-50 border-amber-100 dark:bg-amber-950/50 dark:border-amber-900',
  offer: 'bg-green-50 border-green-100 dark:bg-green-950/50 dark:border-green-900',
  rejected: 'bg-red-50 border-red-100 dark:bg-red-950/50 dark:border-red-900',
  ghosted: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-700',
  withdrawn: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-700',
}

function CardInner({
  app,
  onDelete,
  dragHandleProps,
}: {
  app: JobApplication
  onDelete: (id: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}) {
  const navigate = useNavigate()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Delete "${app.company} — ${app.role}"?`)) onDelete(app.id)
  }

  return (
    <Card
      onClick={() => navigate(`/applications/${app.id}/edit`)}
      className="cursor-pointer hover:shadow-sm transition-shadow group bg-white dark:bg-card"
    >
      <CardHeader className="p-3 pb-1">
        <div className="flex items-start gap-1.5">
          <button
            className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
            {...dragHandleProps}
          >
            <GripVertical className="size-3.5" />
          </button>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">{app.company}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{app.role}</p>
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
      {(app.location ?? app.appliedDate ?? app.fitScore) && (
        <CardContent className="p-3 pt-1">
          {app.location && (
            <p className="text-xs text-muted-foreground truncate">
              {app.location}{app.remote ? ' · Remote' : ''}
            </p>
          )}
          {app.appliedDate && (
            <p className="text-xs text-muted-foreground truncate">
              Applied {new Date(app.appliedDate).toLocaleDateString()}
            </p>
          )}
          {typeof app.fitScore === 'number' && (
            <p className={cn(
              'text-xs font-medium mt-1',
              app.fitScore >= 0.75 ? 'text-green-600 dark:text-green-400'
                : app.fitScore >= 0.5 ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
            )}>
              {Math.round(app.fitScore * 100)}% fit
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function DraggableCard({
  app,
  onDelete,
}: {
  app: JobApplication
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
    data: { app },
  })

  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={isDragging ? 'opacity-30' : ''}
    >
      <CardInner app={app} onDelete={onDelete} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function DroppableColumn({
  status,
  apps,
  onDelete,
}: {
  status: ApplicationStatus
  apps: JobApplication[]
  onDelete: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {STATUS_LABELS[status]}
        </span>
        {apps.length > 0 && (
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {apps.length}
          </Badge>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'rounded-lg border p-2 min-h-24 flex flex-col gap-2 transition-all',
          STATUS_COLORS[status],
          isOver && 'ring-2 ring-primary ring-offset-1'
        )}
      >
        {apps.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">—</p>
        ) : (
          apps.map((app) => (
            <DraggableCard key={app.id} app={app} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  )
}

export default function BoardPage() {
  const { applications, loading, error, refresh } = useApplications()
  const [activeApp, setActiveApp] = useState<JobApplication | null>(null)
  const [search, setSearch] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const byStatus = useMemo(() => {
    const filtered = applications.filter(
      (a) =>
        (!search ||
          `${a.company} ${a.role}`.toLowerCase().includes(search.toLowerCase())) &&
        (!remoteOnly || a.remote)
    )
    return STATUS_ORDER.reduce(
      (acc, status) => {
        acc[status] = filtered.filter((a) => a.status === status)
        return acc
      },
      {} as Record<ApplicationStatus, JobApplication[]>
    )
  }, [applications, search, remoteOnly])

  function handleDragStart(event: DragStartEvent) {
    setActiveApp((event.active.data.current as { app: JobApplication } | undefined)?.app ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveApp(null)
    if (!over) return

    const appId = active.id as string
    const newStatus = over.id as ApplicationStatus
    const app = applications.find((a) => a.id === appId)
    if (!app || app.status === newStatus) return

    await fetch(`/api/applications/${appId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, occurredAt: new Date().toISOString() }),
    })
    refresh()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    refresh()
  }

  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>
  if (error) return <p className="text-destructive text-sm">Error: {error}</p>

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <FilterBar search={search} onSearch={setSearch} remoteOnly={remoteOnly} onRemoteOnly={setRemoteOnly} />
      <div className="pb-4">
        <div className="flex gap-2">
          {STATUS_ORDER.map((status) => (
            <DroppableColumn
              key={status}
              status={status}
              apps={byStatus[status]}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeApp && (
          <div className="min-w-48 w-56 rotate-1 shadow-xl">
            <CardInner app={activeApp} onDelete={() => undefined} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
