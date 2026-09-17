import { Outlet } from 'react-router-dom'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="min-h-dvh bg-ink text-foam">
      <Sidebar />
      <div className="md:pl-[15.5rem]">
        <TopBar />
        <main className="pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-12">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
