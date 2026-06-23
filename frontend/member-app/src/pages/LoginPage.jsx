import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-member-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-electric-orange/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-tertiary-container/10 rounded-full blur-3xl pointer-events-none" />

      <div className="page-enter w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-lexend font-black text-5xl text-orange-500 italic tracking-tighter text-glow-orange">ApexFit</h1>
          <p className="font-inter text-sm text-on-surface-variant mt-2">Your premium fitness companion</p>
        </div>

        <form id="login-form" onSubmit={handleSubmit}
          className="bg-member-surface border border-outline-variant rounded-2xl p-6 space-y-5 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">

          <div>
            <h2 className="font-lexend font-semibold text-xl text-on-surface">Welcome back</h2>
            <p className="font-inter text-xs text-on-surface-variant mt-0.5">Sign in with your email</p>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="font-inter text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><Icon name="mail" size={18} /></span>
              <input id="email" type="email" autoComplete="email" required value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-colors" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="font-inter text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><Icon name="lock" size={18} /></span>
              <input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-12 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-colors" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                <Icon name={showPw ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-error-container/30 border border-error/40 rounded-xl px-4 py-3">
              <Icon name="error" size={16} className="text-error flex-shrink-0" />
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button id="btn-login" type="submit" disabled={loading}
            className="w-full h-12 bg-electric-orange text-white font-lexend font-bold uppercase tracking-wider rounded-xl glow-orange hover:bg-primary-container transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <><span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />Signing in…</>
            ) : (
              <><Icon name="login" size={18} />Sign In</>
            )}
          </button>
        </form>

        <p className="text-center font-inter text-sm text-on-surface-variant mt-6">
          New to ApexFit?{' '}
          <Link to="/register" className="text-orange-400 font-semibold hover:text-orange-300 transition-colors underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
