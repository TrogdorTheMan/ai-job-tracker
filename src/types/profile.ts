// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

export interface UserProfile {
  userId: string
  resumeText: string
  hasEmbedding: boolean
  aiConfigured: boolean
  updatedAt: string
  warning?: string
}
