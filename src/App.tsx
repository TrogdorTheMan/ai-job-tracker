// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/components/auth/LoginPage'
import BoardPage from '@/pages/BoardPage'
import ListPage from '@/pages/ListPage'
import SearchPage from '@/pages/SearchPage'
import ApplicationFormPage from '@/pages/ApplicationFormPage'
import ProfilePage from '@/pages/ProfilePage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <LoginPage />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell user={user} />}>
          <Route index element={<Navigate to="/board" replace />} />
          <Route path="board" element={<BoardPage />} />
          <Route path="list" element={<ListPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="applications/new" element={<ApplicationFormPage />} />
          <Route path="applications/:id/edit" element={<ApplicationFormPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
