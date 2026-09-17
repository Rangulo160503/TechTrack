import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AssetDetailPage } from './pages/AssetDetailPage'
import { AssetsPage } from './pages/AssetsPage'
import { BrowsePage } from './pages/BrowsePage'
import { CatalogsPage } from './pages/CatalogsPage'
import { LivePage } from './pages/LivePage'
import { MaintenancePage } from './pages/MaintenancePage'
import { MorePage } from './pages/MorePage'
import { ProfilePage } from './pages/ProfilePage'
import { ReportsPage } from './pages/ReportsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<BrowsePage />} />
        <Route path="live" element={<LivePage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="assets/:id" element={<AssetDetailPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="maintenance/new" element={<MaintenancePage />} />
        <Route path="catalogs" element={<CatalogsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
