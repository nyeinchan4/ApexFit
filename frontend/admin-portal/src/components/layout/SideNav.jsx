import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/dashboard',          icon: 'dashboard',            label: 'Dashboard' },
  { to: '/members',            icon: 'group',                label: 'Member Management' },
  { to: '/cash-verification',  icon: 'payments',             label: 'Cash Verification' },
  { to: '/plan-configurator',  icon: 'settings_suggest',     label: 'Plan Configurator', adminOnly: true },
]

export default function SideNav() {
  const { user, logout } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 border-r border-slate-200 bg-white z-40 flex flex-col py-6">
      {/* Brand */}
      <div className="px-6 mb-8">
        <h1 className="text-xl font-black tracking-tighter text-indigo-900">ApexFit</h1>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Operations Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {navItems.map(({ to, icon, label, adminOnly }) => {
          if (adminOnly && user?.role !== 'admin') return null
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                 ${isActive
                   ? 'bg-indigo-50 text-indigo-900 border-r-4 border-indigo-900 rounded-r-none'
                   : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-900'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'icon-fill' : ''}`}>{icon}</span>
                  {label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-900 font-bold text-xs">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Logout
        </button>
      </div>
    </aside>
  )
}
