import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { api } from './api.js'
import { useAuth, useUI } from './state.jsx'
import { Spinner } from './ui.jsx'
import AuthModal from './components/AuthModal.jsx'
import AppHeader from './components/AppHeader.jsx'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProgramView from './pages/ProgramView.jsx'
import Course from './pages/Course.jsx'
import Verify from './pages/Verify.jsx'
import Alumni from './pages/Alumni.jsx'
import Profile from './pages/Profile.jsx'

// Handles the redirect/query-param flows the backend uses (it always redirects
// back to `/` with a param): magic-link, password reset, payment return, oauth error.
function FlowHandler() {
  const { refresh } = useAuth()
  const { openAuth, toast } = useUI()
  const navigate = useNavigate()
  const location = useLocation()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    const params = new URLSearchParams(location.search)
    const magic = params.get('magic')
    const reset = params.get('reset')
    const ref = params.get('ref')
    const autherror = params.get('autherror')
    if (!magic && !reset && !ref && !autherror) return
    handled.current = true

    const clean = () => window.history.replaceState({}, '', location.pathname)

    ;(async () => {
      try {
        if (autherror) {
          toast('Sign-in failed. Please try again.', 'error')
          clean()
        } else if (magic) {
          const { user } = await api.magicVerify(magic)
          await refresh()
          clean()
          toast(`Welcome, ${user.name.split(' ')[0]}.`, 'success')
          navigate('/app')
        } else if (reset) {
          clean()
          openAuth('reset', { token: reset })
        } else if (ref) {
          const res = await api.verifyPayment(ref)
          clean()
          if (res.paid) {
            await refresh()
            toast('Payment confirmed — you are enrolled.', 'success')
            navigate('/app')
          } else {
            toast('Payment not confirmed yet. If you completed checkout, refresh in a moment.', 'error')
          }
        }
      } catch (err) {
        toast(err.message || 'Something went wrong.', 'error')
        clean()
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// Gate for signed-in-only routes. While auth is resolving, show a spinner; if the
// user isn't signed in, bounce to the landing page and open the sign-in modal.
function Protected({ children }) {
  const { user, loading } = useAuth()
  const { openAuth } = useUI()
  const navigate = useNavigate()
  const bounced = useRef(false)

  useEffect(() => {
    if (!loading && !user && !bounced.current) {
      bounced.current = true
      openAuth('login')
      navigate('/', { replace: true })
    }
  }, [loading, user, openAuth, navigate])

  if (loading) return <Spinner label="Loading…" />
  if (!user) return null
  return children
}

// Shared shell (header + content) for the signed-in app pages.
function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="mx-auto max-w-[1120px] px-5 py-8 sm:px-7">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <>
      <FlowHandler />
      <AuthModal />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/verify/:credId" element={<Verify />} />
        <Route
          path="/app"
          element={
            <Protected>
              <AppShell>
                <Dashboard />
              </AppShell>
            </Protected>
          }
        />
        <Route
          path="/program/:id"
          element={
            <AppShell>
              <ProgramView />
            </AppShell>
          }
        />
        <Route
          path="/course/:id"
          element={
            <Protected>
              <AppShell>
                <Course />
              </AppShell>
            </Protected>
          }
        />
        <Route
          path="/alumni"
          element={
            <Protected>
              <AppShell>
                <Alumni />
              </AppShell>
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <AppShell>
                <Profile />
              </AppShell>
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
