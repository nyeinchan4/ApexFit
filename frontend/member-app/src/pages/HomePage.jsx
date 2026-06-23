import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MembershipGauge from '../components/MembershipGauge'
import Icon from '../components/Icon'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function StatCard({ icon, label, value, unit }) {
  return (
    <div className="bg-member-surface rounded-xl border border-outline-variant/60 p-4 flex flex-col gap-2 hover:border-orange-500/40 transition-colors">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <Icon name={icon} size={20} className="text-electric-orange" />
        <span className="font-inter font-bold text-[11px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="font-lexend font-bold text-[32px] leading-none text-on-surface">{value}</span>
        <span className="font-inter text-sm text-on-surface-variant pb-0.5">{unit}</span>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.username ?? user?.name ?? 'Member'

  return (
    <div className="page-enter min-h-dvh bg-member-bg text-on-surface pb-24 pt-20">
      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">

        {/* Welcome */}
        <div className="flex justify-between items-end">
          <div>
            <p className="font-inter text-sm text-on-surface-variant mb-0.5">{getGreeting()},</p>
            <h2 className="font-lexend font-semibold text-2xl text-on-surface">{displayName}</h2>
          </div>
          <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${
            user?.plan
              ? 'bg-surface-variant border-outline-variant'
              : 'bg-surface-variant border-outline-variant/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              user?.plan
                ? 'bg-electric-orange shadow-[0_0_8px_rgba(255,87,34,0.6)]'
                : 'bg-on-surface-variant'
            }`} />
            <span className={`font-inter font-bold text-[11px] uppercase tracking-widest ${
              user?.plan ? 'text-electric-orange' : 'text-on-surface-variant'
            }`}>
              {user?.plan ?? 'No Plan'}
            </span>
          </div>
        </div>

        {/* Membership Gauge Card */}
        <div className="bg-member-surface rounded-xl border border-outline-variant/60 p-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-40 h-40 bg-electric-orange opacity-5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
          <div className="flex flex-col items-center relative z-10">
            <h3 className="font-inter text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
              Membership Status
            </h3>
            {user?.plan ? (
              <>
                <MembershipGauge daysLeft={user?.daysLeft} totalDays={user?.totalDays} />
                <p className="font-inter text-sm text-on-surface-variant mt-4 bg-surface-container-low px-4 py-2 rounded-lg">
                  Expires on{' '}
                  <strong className="text-on-surface">{user?.expiresOn ?? 'N/A'}</strong>
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center">
                  <Icon name="fitness_center" size={32} className="text-on-surface-variant opacity-40" />
                </div>
                <p className="font-lexend font-semibold text-on-surface-variant text-base">No Active Plan</p>
                <p className="font-inter text-xs text-on-surface-variant opacity-60 text-center mb-2">Subscribe to a membership plan to track your progress.</p>
                <button
                  onClick={() => navigate('/plans')}
                  className="bg-electric-orange text-white px-6 py-2.5 rounded-lg font-inter font-bold text-xs uppercase tracking-wider hover:bg-primary-container transition-colors flex items-center gap-2"
                >
                  <Icon name="add_circle" size={18} filled />
                  Buy Plan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon="local_fire_department" label="Workouts" value={user?.workoutsThisMonth ?? 0} unit="this month" />
          <StatCard icon="timer"                 label="Avg Duration" value={user?.avgDuration ?? 0}    unit="mins" />
        </div>

        {/* Next Class Banner */}
        <div className="bg-surface-variant rounded-xl p-5 border-l-4 border-electric-orange">
          <div className="flex gap-4 items-center">
            <div className="bg-surface-container-high p-2 rounded-full text-electric-orange flex-shrink-0">
              <Icon name="calendar_today" size={20} />
            </div>
            <div>
              <h4 className="font-inter font-bold text-sm text-on-surface mb-0.5">Next Class</h4>
              <p className="font-inter text-sm text-on-surface-variant">{user?.nextClass}</p>
            </div>
          </div>
        </div>

        {/* Motivation Banner */}
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/60">
          <div className="flex gap-4 items-center">
            <div className="bg-electric-orange/10 p-2 rounded-full text-electric-orange flex-shrink-0">
              <Icon name="bolt" size={20} filled />
            </div>
            <div>
              <h4 className="font-inter font-bold text-sm text-on-surface mb-0.5">Keep the momentum!</h4>
              <p className="font-inter text-sm text-on-surface-variant">You're 2 workouts away from your weekly goal.</p>
            </div>
          </div>
        </div>

      </main>

      {/* FAB — Scan Entry */}
      <div className="fixed bottom-24 right-4 z-40">
        <button
          id="btn-scan-entry"
          className="bg-electric-orange text-white h-14 px-5 rounded-full font-inter font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,87,34,0.45)] active:scale-95 transition-transform hover:bg-primary-container"
          aria-label="Scan entry QR code"
        >
          <Icon name="qr_code_scanner" size={20} filled />
          Scan Entry
        </button>
      </div>
    </div>
  )
}
