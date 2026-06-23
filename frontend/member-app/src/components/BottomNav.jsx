import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/',         icon: 'bolt',           label: 'Pulse',    filledIcon: 'bolt'          },
  { to: '/bookings', icon: 'calendar_today', label: 'Bookings', filledIcon: 'calendar_today' },
  { to: '/profile',  icon: 'person',         label: 'Profile',  filledIcon: 'person'         },
]

export default function BottomNav() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return null

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 rounded-t-2xl bg-zinc-950/95 backdrop-blur-lg shadow-[0_-4px_24px_rgba(0,0,0,0.5)] flex justify-around items-center h-20 px-2 pb-safe md:hidden">
      {NAV_ITEMS.map(({ to, icon, filledIcon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all active:scale-90 w-touch-target-min h-touch-target-min gap-0.5 ${
              isActive
                ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(255,87,34,0.4)]'
                : 'text-zinc-500 hover:text-orange-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={isActive ? filledIcon : icon} filled={isActive} size={22} />
              <span className="font-lexend font-semibold text-[10px] uppercase">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
