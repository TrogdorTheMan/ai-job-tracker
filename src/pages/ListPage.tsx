// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, ChevronsUpDown, Trash2, Pencil, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useApplications } from '@/hooks/useApplications'
import { STATUS_ORDER, STATUS_LABELS } from '@/types/job'
import type { ApplicationStatus } from '@/types/job'
import { cn } from '@/lib/utils'
import FilterBar from '@/components/filters/FilterBar'

type SortField = 'company' | 'role' | 'status' | 'appliedDate'
type SortDir = 'asc' | 'desc'

function SortIcon({ field, sort }: { field: SortField; sort: { field: SortField; dir: SortDir } }) {
  if (sort.field !== field) return <ChevronsUpDown className="size-3 ml-1 opacity-40" />
  return sort.dir === 'asc'
    ? <ChevronUp className="size-3 ml-1" />
    : <ChevronDown className="size-3 ml-1" />
}

export default function ListPage() {
  const { applications, loading, error, refresh } = useApplications()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus[]>([])
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'appliedDate', dir: 'desc' })

  function toggleStatus(s: ApplicationStatus) {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function toggleSort(field: SortField) {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' }
    )
  }

  const visible = useMemo(() => {
    const filtered = applications
      .filter(
        (a) =>
          (!search ||
            `${a.company} ${a.role}`.toLowerCase().includes(search.toLowerCase())) &&
          (!remoteOnly || a.remote) &&
          (statusFilter.length === 0 || statusFilter.includes(a.status))
      )

    const sortMap: Record<SortField, (a: typeof applications[0], b: typeof applications[0]) => number> = {
      company: (a, b) => a.company.localeCompare(b.company),
      role: (a, b) => a.role.localeCompare(b.role),
      status: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
      appliedDate: (a, b) => (a.appliedDate ?? '').localeCompare(b.appliedDate ?? ''),
    }

    return [...filtered].sort((a, b) => {
      const cmp = sortMap[sort.field](a, b)
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [applications, search, remoteOnly, statusFilter, sort])

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete "${label}"?`)) return
    await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    refresh()
  }

  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>
  if (error) return <p className="text-destructive text-sm">Error: {error}</p>

  if (applications.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">No applications yet.</p>
        <Button className="mt-4" onClick={() => navigate('/applications/new')}>
          Add your first job
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <FilterBar search={search} onSearch={setSearch} remoteOnly={remoteOnly} onRemoteOnly={setRemoteOnly} />

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_ORDER.map((s) => {
          const active = statusFilter.includes(s)
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                active
                  ? 'bg-foreground text-background border-foreground'
                  : 'text-muted-foreground border-border hover:border-foreground hover:text-foreground'
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          )
        })}
        {statusFilter.length > 0 && (
          <button
            onClick={() => setStatusFilter([])}
            className="text-xs px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No applications match the current filters.</p>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {(
                  [
                    { field: 'company' as SortField, label: 'Company' },
                    { field: 'role' as SortField, label: 'Role' },
                    { field: 'status' as SortField, label: 'Status' },
                  ] as const
                ).map(({ field, label }) => (
                  <th key={field} className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    <button
                      onClick={() => toggleSort(field)}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      {label}
                      <SortIcon field={field} sort={sort} />
                    </button>
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">
                  Location
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">
                  <button
                    onClick={() => toggleSort('appliedDate')}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Applied
                    <SortIcon field="appliedDate" sort={sort} />
                  </button>
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((app) => (
                <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-1.5">
                      {app.company}
                      {app.url && (
                        <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{app.role}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{STATUS_LABELS[app.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {app.location ?? '—'}{app.remote ? ' · Remote' : ''}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => navigate(`/applications/${app.id}/edit`)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(app.id, `${app.company} — ${app.role}`)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
