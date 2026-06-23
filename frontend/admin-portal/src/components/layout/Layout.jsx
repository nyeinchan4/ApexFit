import { Outlet } from 'react-router-dom'
import SideNav from './SideNav'
import TopBar from './TopBar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SideNav />
      <TopBar />
      <main className="ml-60 pt-16 p-6 max-w-[1440px]">
        <div className='pt-6'>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
