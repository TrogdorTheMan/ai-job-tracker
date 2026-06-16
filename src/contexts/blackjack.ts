// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { createContext, useContext } from 'react'

export const BlackjackContext = createContext<{ open: () => void }>({ open: () => {} })
export const useBlackjack = () => useContext(BlackjackContext)
