// ai-job-tracker — AI-assisted job tracker and search tool
// Copyright (C) 2026 Cory "TrogdorTheMan" Francis
// Licensed under the GNU AGPLv3. See LICENSE for details.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import BoardPage from '@/pages/BoardPage'
import ListPage from '@/pages/ListPage'
import ApplicationFormPage from '@/pages/ApplicationFormPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/board" replace />} />
          <Route path="board" element={<BoardPage />} />
          <Route path="list" element={<ListPage />} />
          <Route path="applications/new" element={<ApplicationFormPage />} />
          <Route path="applications/:id/edit" element={<ApplicationFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
