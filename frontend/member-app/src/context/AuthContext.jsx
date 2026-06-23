import axios from 'axios'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

// API gateway base — Vite proxy rewrites /api → http://localhost:3000
const api = axios.create({ baseURL: '/api/v1', withCredentials: true })

// Attach access token to every request
api.interceptors.request.use(cfg => {
  const token = window.__apexAccessToken__
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto-refresh on 401
api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      try {
        const { data } = await api.post('/auth/refresh', {}, { withCredentials: true })
        window.__apexAccessToken__ = data.data.accessToken
        orig.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(orig)
      } catch {
        window.__apexAccessToken__ = null
      }
    }
    return Promise.reject(err)
  }
)

async function enrichProfileWithSubscription(profile) {
  try {
    const { data } = await api.get('/subscriptions/me')
    if (data.success && data.data.active) {
      const sub = data.data.active
      return {
        ...profile,
        plan:        sub.plan_name,
        planStatus:  sub.status,
        daysLeft:    sub.days_remaining || 0,
        totalDays:   sub.duration_days || 30,
        expiresOn:   sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'N/A',
      }
    }
  } catch (err) {
    // No active subscription — return profile as-is
  }
  return profile
}

function buildProfile(apiUser) {
  return {
    id:                apiUser.id,
    email:             apiUser.email,
    username:          apiUser.username,
    name:              apiUser.username, // Use username as display name
    role:              apiUser.role,
    // Membership defaults — null until subscription is active
    plan:              null,
    planStatus:        null,
    daysLeft:          0,
    totalDays:         30,
    expiresOn:         null,
    workoutsThisMonth: 0,
    avgDuration:       0,
    nextClass:         'No class booked yet',
    joinedDate:        new Date().toISOString().slice(0, 10),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [token, setToken]         = useState(null)
  const [initializing, setInit]   = useState(true)

  // ── Silent restore on page refresh ───────────────────
  useEffect(() => {
    // Fast-path: no cookie hint stored → skip network call entirely
    if (!localStorage.getItem('apex_has_session')) {
      setInit(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000) // 3s timeout

    api
      .post('/auth/refresh', {}, { signal: controller.signal })
      .then(async ({ data }) => {
        window.__apexAccessToken__ = data.data.accessToken
        setToken(data.data.accessToken)
        const profile = buildProfile(data.data.user)
        const enriched = await enrichProfileWithSubscription(profile)
        setUser(enriched)
      })
      .catch(err => {
        // Clean up on any error (401, timeout, network, etc.)
        window.__apexAccessToken__ = null
        localStorage.removeItem('apex_has_session')
        console.log('[Auth] Session restore failed:', err.message)
      })
      .finally(() => {
        clearTimeout(timer)
        setInit(false)
      })
    return () => { controller.abort(); clearTimeout(timer) }
  }, [])

  // ── Register ─────────────────────────────────────────
  // POST /api/v1/auth/register  { email, username, password }
  const register = useCallback(async ({ email, username, password }) => {
    try {
      const { data } = await api.post('/auth/register', {
        email,
        username,
        password,
      })
      const profile = buildProfile(data.data.user)
      window.__apexAccessToken__ = data.data.accessToken
      localStorage.setItem('apex_has_session', '1')
      const enriched = await enrichProfileWithSubscription(profile)
      setToken(data.data.accessToken)
      setUser(enriched)
      return enriched
    } catch (err) {
      const msg =
        err.response?.data?.error ??
        err.response?.data?.details?.[0]?.msg ??
        'Registration failed. Please try again.'
      throw new Error(msg)
    }
  }, [])

  // ── Login ─────────────────────────────────────────────
  // POST /api/v1/auth/login  { email, password }
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      const profile = buildProfile(data.data.user)
      window.__apexAccessToken__ = data.data.accessToken
      localStorage.setItem('apex_has_session', '1')
      const enriched = await enrichProfileWithSubscription(profile)
      setToken(data.data.accessToken)
      setUser(enriched)
      return enriched
    } catch (err) {
      const msg =
        err.response?.data?.error ??
        err.response?.data?.details?.[0]?.msg ??
        'Invalid email or password.'
      throw new Error(msg)
    }
  }, [])

  // ── Logout ────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    window.__apexAccessToken__ = null
    localStorage.removeItem('apex_has_session')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!user, initializing }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
