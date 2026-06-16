// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { ExternalLink } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useBlackjack } from '@/contexts/blackjack'

export default function AboutPage() {
  const { open } = useBlackjack()

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-lg font-semibold">About</h1>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          An open-source, self-hosted job tracker with AI fit scoring. Built because paying
          for something this straightforward is absurd.
        </p>
        <blockquote className="border-l-2 border-border pl-4 text-sm text-muted-foreground italic">
          "Screw your AI-assisted job tool I have to pay for. I'll build my own — with{' '}
          <button
            onClick={open}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            blackjack
          </button>
          , and LinkedIn!"
        </blockquote>
        <p className="text-xs text-muted-foreground">— with apologies to Bender 🤖</p>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <p className="text-sm font-medium">License</p>
        <p className="text-sm text-muted-foreground">GNU Affero General Public License v3.0 (AGPLv3)</p>
        <p className="text-xs text-muted-foreground">
          Copyright © 2026 Cory "TrogdorTheMan" Francis. Free to use, modify, and distribute
          under the AGPLv3 — source must remain open even when run as a hosted service.
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">Source</p>
        <a
          href="https://github.com/TrogdorTheMan/ai-job-tracker"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          github.com/TrogdorTheMan/ai-job-tracker
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  )
}
