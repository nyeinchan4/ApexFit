import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import TopBar      from './components/TopBar'
import BottomNav   from './components/BottomNav'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage    from './pages/HomePage'
import BookingsPage from './pages/BookingsPage'
import ProfilePage  from './pages/ProfilePage'
import PlansPage    from './pages/PlansPage'

// Splash shown while the silent token refresh is in-flight
function InitSplash() {
  return (
    <div className="min-h-dvh bg-member-bg flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-electric-orange/20 border-t-electric-orange animate-spin" />
      <p className="font-inter text-sm text-on-surface-variant tracking-widest uppercase">Loading…</p>
    </div>
  )
}

// Guard: redirect to /login if not authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth()
  if (initializing) return <InitSplash />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Guard: redirect to / if already authenticated
function PublicRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth()
  if (initializing) return <InitSplash />
  return isAuthenticated ? <Navigate to="/" replace /> : children
}

function AppShell() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      {isAuthenticated && <TopBar />}

      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {isAuthenticated && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
