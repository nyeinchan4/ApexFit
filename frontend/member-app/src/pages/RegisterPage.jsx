import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

// Password strength meter
function StrengthBar({ password }) {
  const score = (() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 8)           s++
    if (/[A-Z]/.test(password))         s++
    if (/[0-9]/.test(password))         s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const labels    = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const barColors = ['', 'bg-status-expired', 'bg-status-pending', 'bg-tertiary', 'bg-status-active']
  const txtColors = ['', 'text-status-expired', 'text-status-pending', 'text-tertiary', 'text-status-active']

  if (!password) return null
  return (
    <div className="space-y-1 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? barColors[score] : 'bg-outline-variant'}`} />
        ))}
      </div>
      <p className={`font-inter text-xs font-semibold ${txtColors[score]}`}>{labels[score]}</p>
    </div>
  )
}

function Field({ id, label, type = 'text', icon, value, onChange, placeholder, autoComplete, rightEl }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="font-inter text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
          <Icon name={icon} size={18} />
        </span>
        <input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete} required
          className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-colors"
          style={rightEl ? { paddingRight: '3rem' } : {}}
        />
        {rightEl && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [username,  setUsername]    = useState('')
  const [email,     setEmail]       = useState('')
  const [password,  setPassword]    = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showPw,      setShowPw]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error,   setError]         = useState('')

  function validate() {
    if (!username.trim())              return 'Username is required.'
    if (username.length < 3)           return 'Username must be at least 3 characters.'
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores.'
    if (!/\S+@\S+\.\S+/.test(email))   return 'Please enter a valid email address.'
    if (password.length < 8)           return 'Password must be at least 8 characters.'
    if (password !== confirmPw)        return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)
    try {
      await register({ email, username, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const pwToggle = (visible, setVisible, label) => (
    <button type="button" onClick={() => setVisible(v => !v)}
      className="text-on-surface-variant hover:text-on-surface transition-colors"
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}>
      <Icon name={visible ? 'visibility_off' : 'visibility'} size={18} />
    </button>
  )

  return (
    <div className="min-h-dvh bg-member-bg flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-electric-orange/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />

      <div className="page-enter w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-lexend font-black text-5xl text-orange-500 italic tracking-tighter text-glow-orange">ApexFit</h1>
          <p className="font-inter text-sm text-on-surface-variant mt-2">Start your fitness journey today</p>
        </div>

        <form id="register-form" onSubmit={handleSubmit}
          className="bg-member-surface border border-outline-variant rounded-2xl p-6 space-y-4 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">

          <div>
            <h2 className="font-lexend font-semibold text-xl text-on-surface">Create account</h2>
            <p className="font-inter text-xs text-on-surface-variant mt-0.5">No verification required — instant access</p>
          </div>

          {/* Username */}
          <Field id="username" label="Username" icon="person"
            value={username} onChange={e => setUsername(e.target.value)}
            placeholder="alex_fit" autoComplete="username" />

          {/* Email */}
          <Field id="reg-email" label="Email" type="email" icon="mail"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="email" />

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="reg-password" className="font-inter text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><Icon name="lock" size={18} /></span>
              <input id="reg-password" type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                autoComplete="new-password" required
                className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-12 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-colors" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">{pwToggle(showPw, setShowPw, 'password')}</div>
            </div>
            <StrengthBar password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="reg-confirm" className="font-inter text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><Icon name="lock_open" size={18} /></span>
              <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password"
                autoComplete="new-password" required
                className={`w-full bg-surface-container border rounded-xl pl-10 pr-12 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 transition-colors ${
                  confirmPw && confirmPw !== password
                    ? 'border-error focus:border-error focus:ring-error/40'
                    : confirmPw && confirmPw === password
                      ? 'border-status-active focus:border-status-active focus:ring-status-active/40'
                      : 'border-outline-variant focus:border-orange-500 focus:ring-orange-500/40'
                }`} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">{pwToggle(showConfirm, setShowConfirm, 'confirm')}</div>
            </div>
            {confirmPw && confirmPw === password && (
              <p className="font-inter text-xs text-status-active flex items-center gap-1">
                <Icon name="check_circle" size={12} filled className="text-status-active" /> Passwords match
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-error-container/30 border border-error/40 rounded-xl px-4 py-3">
              <Icon name="error" size={16} className="text-error flex-shrink-0" />
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button id="btn-register" type="submit" disabled={loading}
            className="w-full h-12 bg-electric-orange text-white font-lexend font-bold uppercase tracking-wider rounded-xl glow-orange hover:bg-primary-container transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <><span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />Creating account…</>
            ) : (
              <><Icon name="person_add" size={18} />Create Account</>
            )}
          </button>
        </form>

        <p className="text-center font-inter text-sm text-on-surface-variant mt-6">
          Already a member?{' '}
          <Link to="/login" className="text-orange-400 font-semibold hover:text-orange-300 transition-colors underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
