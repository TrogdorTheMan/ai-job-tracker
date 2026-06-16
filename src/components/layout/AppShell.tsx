// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { Link, NavLink, Outlet } from 'react-router-dom'
import { LayoutGrid, List, LogOut, Moon, Plus, Search, Sun, User, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ClientPrincipal } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

export default function AppShell({ user }: { user: ClientPrincipal }) {
  const { theme, toggle } = useTheme()
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
              <NavLink
                to="/search"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )
                }
              >
                <Search className="size-4" />
                Search
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )
                }
              >
                <FileText className="size-4" />
                Profile
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link to="/applications/new">
                <Plus className="size-4" />
                Add job
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground pl-2 border-l border-border">
              <User className="size-3.5" />
              <span className="max-w-24 truncate">{user.userDetails}</span>
            </div>
            <Button variant="ghost" size="icon" asChild title="Sign out">
              <a href="/.auth/logout?post_logout_redirect_uri=/">
                <LogOut className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>
      <main className="px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
