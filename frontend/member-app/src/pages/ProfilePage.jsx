import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import MembershipGauge from '../components/MembershipGauge'

const STATUS_STYLE = {
  active:  'text-status-active  bg-status-active/10  border-status-active/30',
  expired: 'text-status-expired bg-status-expired/10 border-status-expired/30',
  pending: 'text-status-pending bg-status-pending/10 border-status-pending/30',
}

function SettingRow({ id, icon, label, sublabel, danger = false, onClick, rightEl }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-container transition-colors min-h-touch-target-min group text-left`}
    >
      <div className="flex items-center gap-3">
        <Icon
          name={icon}
          size={20}
          className={danger ? 'text-error' : 'text-on-surface-variant group-hover:text-on-surface transition-colors'}
        />
        <div>
          <p className={`font-inter text-sm font-semibold ${danger ? 'text-error' : 'text-on-surface'}`}>{label}</p>
          {sublabel && <p className="font-inter text-xs text-on-surface-variant mt-0.5">{sublabel}</p>}
        </div>
      </div>
      {rightEl ?? <Icon name="chevron_right" size={18} className="text-on-surface-variant/50" />}
    </button>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name?.split(' ').map(n => n[0]).join('') ?? 'U'
  const statusStyle = STATUS_STYLE[user?.planStatus] ?? STATUS_STYLE.active
  const joinedYear = user?.joinedDate ? new Date(user.joinedDate).getFullYear() : '2025'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page-enter min-h-dvh bg-member-bg text-on-surface pb-32 pt-20">
      <main className="px-4 py-6 max-w-lg mx-auto space-y-5">

        {/* Profile header */}
        <section className="flex flex-col items-center pt-4 pb-2">
          {/* Avatar ring */}
          <div className="relative w-28 h-28 rounded-full p-[3px] bg-gradient-to-tr from-electric-orange via-orange-400 to-amber-300 shadow-[0_0_24px_rgba(255,87,34,0.35)] mb-4">
            <div className="w-full h-full rounded-full bg-member-surface flex items-center justify-center">
              <span className="font-lexend font-black text-3xl text-orange-400">{initials}</span>
            </div>
            {/* Online dot */}
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-status-active border-2 border-member-bg" />
          </div>

          <h1 className="font-lexend font-semibold text-2xl text-on-surface">{user?.name}</h1>
          <p className="font-inter text-sm text-on-surface-variant mt-0.5">{user?.email}</p>

          {/* Plan badge */}
          <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full border text-xs font-inter font-bold uppercase tracking-wider ${statusStyle}`}>
            <Icon name="workspace_premium" size={14} filled />
            {user?.plan}
          </div>

          <p className="font-inter text-xs text-on-surface-variant mt-2">Member since {joinedYear}</p>
        </section>

        {/* Membership card */}
        <section className="bg-member-surface rounded-xl p-5 border border-outline-variant/60 relative overflow-hidden group shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-electric-orange/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-5">
            <div className="flex flex-col items-center sm:items-start">
              <MembershipGauge daysLeft={user?.daysLeft} totalDays={user?.totalDays} />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="font-lexend font-semibold text-lg text-on-surface">{user?.plan}</h2>
              <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-1 rounded-full border text-xs font-inter font-bold uppercase tracking-wider ${statusStyle}`}>
                <Icon name="check_circle" size={12} filled />
                {user?.planStatus}
              </div>
              <p className="font-inter text-xs text-on-surface-variant mt-2">
                Expires <strong className="text-on-surface">May 15, 2026</strong>
              </p>
              <button
                id="btn-renew"
                className="mt-4 bg-electric-orange hover:bg-primary-container text-white font-inter font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg glow-orange transition-all active:scale-95 flex items-center gap-2"
              >
                <Icon name="autorenew" size={16} />
                Renew Plan
              </button>
            </div>
          </div>
        </section>

        {/* Quick stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: 'Workouts', value: user?.workoutsThisMonth ?? 0, icon: 'fitness_center' },
            { label: 'Avg Mins', value: user?.avgDuration ?? 0,       icon: 'timer'          },
            { label: 'Days Left', value: user?.daysLeft ?? 0,         icon: 'event_available'},
          ].map(s => (
            <div key={s.label} className="bg-member-surface rounded-xl border border-outline-variant/60 p-3 flex flex-col items-center gap-1">
              <Icon name={s.icon} size={18} className="text-electric-orange" />
              <span className="font-lexend font-bold text-xl text-on-surface">{s.value}</span>
              <span className="font-inter text-[10px] text-on-surface-variant uppercase tracking-wider text-center">{s.label}</span>
            </div>
          ))}
        </section>

        {/* Account settings */}
        <section className="bg-member-surface rounded-xl border border-outline-variant/60 overflow-hidden shadow-md divide-y divide-outline-variant/30">
          <h3 className="font-inter font-bold text-[10px] uppercase tracking-widest text-on-surface-variant px-4 py-3 bg-surface-container-lowest/60">
            Account
          </h3>
          <SettingRow id="btn-edit-profile"    icon="manage_accounts" label="Edit Profile"        sublabel="Update your name & photo" />
          <SettingRow id="btn-notifications-s" icon="notifications"   label="Notifications"       sublabel="Manage alerts & reminders" />
          <SettingRow id="btn-payment"         icon="credit_card"     label="Payment Methods"     sublabel="Add or remove cards" />
          <SettingRow id="btn-security"        icon="shield"          label="Security"            sublabel="Password & 2FA" />
        </section>

        {/* Support */}
        <section className="bg-member-surface rounded-xl border border-outline-variant/60 overflow-hidden shadow-md divide-y divide-outline-variant/30">
          <h3 className="font-inter font-bold text-[10px] uppercase tracking-widest text-on-surface-variant px-4 py-3 bg-surface-container-lowest/60">
            Support &amp; Legal
          </h3>
          <SettingRow id="btn-help"    icon="help_center"  label="Help & Support" />
          <SettingRow id="btn-privacy" icon="privacy_tip"  label="Privacy Policy" />
          <SettingRow id="btn-terms"   icon="description"  label="Terms of Service" />
        </section>

        {/* Logout */}
        <section className="bg-member-surface rounded-xl border border-outline-variant/60 overflow-hidden shadow-md">
          <SettingRow
            id="btn-logout"
            icon="logout"
            label="Logout"
            danger
            onClick={handleLogout}
            rightEl={null}
          />
        </section>

        <p className="text-center font-inter text-xs text-on-surface-variant/40 pt-2">
          ApexFit v1.0.0 · © 2026
        </p>

      </main>
    </div>
  )
}
