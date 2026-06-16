// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

export interface Resume {
  id: string
  userId: string
  name: string
  resumeText: string
  hasEmbedding: boolean
  aiConfigured: boolean
  aiProvider: 'azure' | 'claude' | null
  generationConfigured: boolean
  createdAt: string
  updatedAt: string
  warning?: string
}
