// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'phone-screen'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'ghosted'
  | 'withdrawn'

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  'phone-screen': 'Phone Screen',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
  withdrawn: 'Withdrawn',
}

export const STATUS_ORDER: ApplicationStatus[] = [
  'saved',
  'applied',
  'phone-screen',
  'interview',
  'offer',
  'rejected',
  'ghosted',
  'withdrawn',
]

export interface Contact {
  id: string
  name: string
  title?: string
  email?: string
  linkedInUrl?: string
  notes?: string
}

export interface StatusEvent {
  id: string
  status: ApplicationStatus
  occurredAt: string
  note?: string
}

export interface JobApplication {
  id: string
  userId: string

  // Core fields
  company: string
  role: string
  url?: string
  location?: string
  remote?: boolean

  // Pipeline state
  status: ApplicationStatus
  appliedDate?: string
  followUpDate?: string
  nextAction?: string

  // Details
  contacts: Contact[]
  notes: string
  jobDescriptionText?: string

  // Timeline
  statusHistory: StatusEvent[]

  // AI fields — populated in M3+
  resumeId?: string
  fitScore?: number
  fitSummary?: string
  fitGaps?: string[]

  // Timestamps
  createdAt: string
  updatedAt: string
}

export type NewJobApplication = Omit<
  JobApplication,
  'id' | 'userId' | 'statusHistory' | 'createdAt' | 'updatedAt' | 'fitScore' | 'fitSummary' | 'fitGaps' | 'resumeId'
> & { resumeId?: string }

export type UpdateJobApplication = Partial<
  Omit<JobApplication, 'id' | 'userId' | 'createdAt'>
>
