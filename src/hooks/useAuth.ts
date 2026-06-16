// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { useState, useEffect } from 'react'

export interface ClientPrincipal {
  identityProvider: string
  userId: string
  userDetails: string
  userRoles: string[]
}

export interface AuthState {
  user: ClientPrincipal | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    fetch('/.auth/me')
      .then((r) => r.json())
      .then((data: { clientPrincipal: ClientPrincipal | null }) => {
        setState({ user: data.clientPrincipal, loading: false })
      })
      .catch(() => setState({ user: null, loading: false }))
  }, [])

  return state
}
