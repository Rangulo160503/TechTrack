import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/layout/AppShell'
import { AssetDetailPage } from './pages/AssetDetailPage'
import { AssetsPage } from './pages/AssetsPage'
import { BrowsePage } from './pages/BrowsePage'
import { CatalogsPage } from './pages/CatalogsPage'
import { ClassHistoryPage } from './pages/ClassHistoryPage'
import { LivePage } from './pages/LivePage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { MorePage } from './pages/MorePage'
import { ProfilePage } from './pages/ProfilePage'
import { ReportsPage } from './pages/ReportsPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { UsagePage } from './pages/UsagePage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<BrowsePage />} />
          <Route path="live" element={<LivePage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="assets/:id" element={<AssetDetailPage />} />
          <Route path="usos" element={<UsagePage />} />
          <Route path="historial-clases" element={<ClassHistoryPage />} />
          <Route path="maintenance" element={<Navigate to="/usos" replace />} />
          <Route path="maintenance/new" element={<Navigate to="/usos" replace />} />
          <Route path="catalogs" element={<CatalogsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
