// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { Link, NavLink, Outlet } from 'react-router-dom'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-semibold text-foreground tracking-tight">
              ai-job-tracker
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/board"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )
                }
              >
                <LayoutGrid className="size-4" />
                Board
              </NavLink>
              <NavLink
                to="/list"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )
                }
              >
                <List className="size-4" />
                List
              </NavLink>
            </nav>
          </div>
          <Button asChild size="sm">
            <Link to="/applications/new">
              <Plus className="size-4" />
              Add job
            </Link>
          </Button>
        </div>
      </header>
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
