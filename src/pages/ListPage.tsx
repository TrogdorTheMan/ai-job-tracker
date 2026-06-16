// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useNavigate } from 'react-router-dom'
import { Trash2, Pencil, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useApplications } from '@/hooks/useApplications'
import { STATUS_LABELS } from '@/types/job'

export default function ListPage() {
  const { applications, loading, error, refresh } = useApplications()
  const navigate = useNavigate()

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
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Company</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Role</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Location</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Applied</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {applications.map((app) => (
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
  )
}
