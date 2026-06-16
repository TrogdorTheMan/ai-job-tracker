// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PROVIDERS = [
  {
    id: 'github',
    label: 'Sign in with GitHub',
    Icon: Github,
  },
  {
    id: 'aad',
    label: 'Sign in with Microsoft',
    Icon: null,
  },
  {
    id: 'google',
    label: 'Sign in with Google',
    Icon: null,
  },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 bg-background">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">ai-job-tracker</h1>
        <p className="text-muted-foreground">
          Your job search pipeline — sign in to get started.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {PROVIDERS.map(({ id, label, Icon }) => (
          <Button
            key={id}
            variant="outline"
            className="w-full gap-2"
            asChild
          >
            <a href={`/.auth/login/${id}?post_login_redirect_uri=/`}>
              {Icon && <Icon className="size-4" />}
              {label}
            </a>
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Your data stays in your own storage. No shared servers, no subscriptions.
      </p>
    </div>
  )
}
