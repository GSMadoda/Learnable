import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth, useUI } from '../state.jsx'
import { Button, Field, Input, Modal } from '../ui.jsx'
import { LogoMark } from './Brand.jsx'

// One modal for every sign-in path the backend supports. Which paths render is
// driven by /api/config (Google + email are optional), exactly like the old app.
export default function AuthModal() {
  const { auth, closeAuth, toast } = useUI()
  const { setUser, config } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState(auth?.mode || 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (!auth) return null

  const resetToken = auth.token // present only for reset mode
  const effMode = auth.mode === 'reset' ? 'reset' : mode

  function switchMode(next) {
    setError('')
    setNotice('')
    setMode(next)
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (effMode === 'signup') {
        const { user } = await api.signup({ name, email, password })
        setUser(user)
        closeAuth()
        toast(`Welcome, ${user.name.split(' ')[0]}.`, 'success')
        navigate('/app')
      } else if (effMode === 'login') {
        const { user } = await api.login({ email, password })
        setUser(user)
        closeAuth()
        toast(`Welcome back, ${user.name.split(' ')[0]}.`, 'success')
        navigate('/app')
      } else if (effMode === 'magic') {
        const res = await api.magic({ email, name })
        setNotice(
          res.devLink
            ? 'Email is off in this environment — use the dev link below.'
            : 'Check your inbox for a sign-in link.',
        )
        if (res.devLink) setNotice(`Dev sign-in link: ${res.devLink}`)
      } else if (effMode === 'forgot') {
        const res = await api.forgot({ email })
        setNotice(
          res.devLink
            ? `Dev reset link: ${res.devLink}`
            : 'If that email has an account, a reset link is on its way.',
        )
      } else if (effMode === 'reset') {
        await api.reset({ token: resetToken, password })
        closeAuth()
        toast('Password updated — please sign in.', 'success')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const titles = {
    login: 'Sign in',
    signup: 'Create your account',
    magic: 'Email me a link',
    forgot: 'Reset your password',
    reset: 'Choose a new password',
  }

  return (
    <Modal onClose={closeAuth} labelledBy="auth-title">
      <div className="mb-5 flex items-center gap-2.5">
        <LogoMark size={30} />
        <span className="font-display text-xl font-extrabold tracking-[-0.02em] text-ink-navy">
          {titles[effMode]}
        </span>
      </div>

      {effMode !== 'reset' && (config.google || config.email) && (
        <div className="mb-5 flex flex-col gap-2.5">
          {config.google && (
            <Button
              as="a"
              href={api.googleUrl}
              variant="ghost"
              className="w-full"
              size="md"
            >
              Continue with Google
            </Button>
          )}
          {config.email && effMode !== 'magic' && effMode !== 'forgot' && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              size="md"
              onClick={() => switchMode('magic')}
            >
              Email me a sign-in link
            </Button>
          )}
          <div className="relative my-1 text-center">
            <span className="relative z-10 bg-white px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
              or
            </span>
            <span className="absolute left-0 top-1/2 h-px w-full bg-line" />
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        {(effMode === 'signup' || effMode === 'magic') && (
          <Field label={effMode === 'magic' ? 'Name (optional)' : 'Name'}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              autoComplete="name"
              required={effMode === 'signup'}
            />
          </Field>
        )}

        {effMode !== 'reset' && (
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </Field>
        )}

        {(effMode === 'login' || effMode === 'signup' || effMode === 'reset') && (
          <Field
            label={effMode === 'reset' ? 'New password' : 'Password'}
            hint={effMode === 'signup' ? 'At least 8 characters.' : undefined}
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={effMode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
            />
          </Field>
        )}

        {error && (
          <div className="rounded-control border border-line bg-blue-50 px-3 py-2 text-[13px] text-ink-navy">
            {error}
          </div>
        )}
        {notice && (
          <div className="break-words rounded-control border border-line bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
            {notice}
          </div>
        )}

        <Button type="submit" size="lg" loading={busy} className="mt-1 w-full">
          {effMode === 'signup'
            ? 'Create account'
            : effMode === 'login'
              ? 'Sign in'
              : effMode === 'magic'
                ? 'Send link'
                : effMode === 'forgot'
                  ? 'Send reset link'
                  : 'Update password'}
        </Button>
      </form>

      {effMode !== 'reset' && (
        <div className="mt-5 space-y-1.5 text-center text-[13.5px] text-slate-500">
          {effMode === 'login' && (
            <>
              <p>
                New here?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-blue">
                  Create an account
                </button>
              </p>
              {config.email && (
                <p>
                  <button type="button" onClick={() => switchMode('forgot')} className="text-slate-400 hover:text-blue">
                    Forgot your password?
                  </button>
                </p>
              )}
            </>
          )}
          {effMode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')} className="font-semibold text-blue">
                Sign in
              </button>
            </p>
          )}
          {(effMode === 'magic' || effMode === 'forgot') && (
            <p>
              <button type="button" onClick={() => switchMode('login')} className="font-semibold text-blue">
                Back to sign in
              </button>
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
