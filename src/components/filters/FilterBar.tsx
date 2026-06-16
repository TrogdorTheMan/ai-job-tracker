// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface FilterBarProps {
  search: string
  onSearch: (v: string) => void
  remoteOnly: boolean
  onRemoteOnly: (v: boolean) => void
}

export default function FilterBar({ search, onSearch, remoteOnly, onRemoteOnly }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative w-56">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search company or role…"
          className="pl-8 h-8 text-sm"
        />
      </div>
      <Button
        size="sm"
        variant={remoteOnly ? 'default' : 'outline'}
        onClick={() => onRemoteOnly(!remoteOnly)}
        className="h-8 text-xs"
      >
        Remote only
      </Button>
    </div>
  )
}
