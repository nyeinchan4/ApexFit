import { useAuth } from '../context/AuthContext'
import Icon from './Icon'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/':          'Pulse',
  '/workouts':  'Workouts',
  '/bookings':  'Bookings',
  '/profile':   'Profile',
}

export default function TopBar() {
  const { user, isAuthenticated } = useAuth()
  const { pathname } = useLocation()

  if (!isAuthenticated) return null

  const initials = user?.name?.split(' ').map(n => n[0]).join('') ?? 'U'

  return (
    <header className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md shadow-[0_4px_20px_rgba(255,87,34,0.12)] flex justify-between items-center px-4 h-16">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full border-2 border-orange-500/50 bg-surface-variant flex items-center justify-center overflow-hidden glow-orange flex-shrink-0">
        <span className="font-lexend font-bold text-sm text-orange-400">{initials}</span>
      </div>

      {/* Title */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <h1 className="text-2xl font-black text-orange-500 italic tracking-tighter font-lexend">ApexFit</h1>
      </div>

      {/* Notifications */}
      <button
        id="btn-notifications"
        className="w-10 h-10 flex items-center justify-center text-orange-500 hover:bg-zinc-800 transition-colors rounded-full active:scale-95 duration-150"
        aria-label="Notifications"
      >
        <Icon name="notifications" />
      </button>
    </header>
  )
}
