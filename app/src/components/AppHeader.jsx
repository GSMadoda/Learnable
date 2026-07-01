import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../state.jsx'
import { LogoMark, Wordmark } from './Brand.jsx'

const baseLinks = [
  { to: '/app', label: 'Dashboard' },
  { to: '/alumni', label: 'Alumni' },
  { to: '/profile', label: 'Profile' },
]

// Header for the signed-in application shell (distinct from the marketing Nav).
export default function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  // Admins get an extra Admin link.
  const navLinks = user?.admin ? [...baseLinks, { to: '/admin', label: 'Admin' }] : baseLinks

  async function onSignOut() {
    await logout()
    setOpen(false)
    navigate('/')
  }

  const isActive = (to) => location.pathname === to

  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-white/[0.9] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-3.5 sm:px-7">
        <Link to="/app" className="flex items-center gap-2.5" aria-label="Learnable home">
          <LogoMark size={28} />
          <Wordmark className="text-lg" />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-[15px] font-medium transition-colors hover:text-ink-navy ${
                isActive(l.to) ? 'text-ink-navy' : 'text-slate-500'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <span className="text-[13px] text-slate-400">{user?.email}</span>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-btn border border-line px-4 py-2 text-[14px] font-semibold text-slate-700 transition-colors hover:bg-blue-50"
          >
            Sign out
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-10 w-10 items-center justify-center rounded-control text-ink-navy transition-colors hover:bg-blue-50 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white md:hidden">
          <div className="mx-auto flex max-w-[1120px] flex-col px-5 py-2">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3.5 text-[15px] font-medium text-slate-700 hover:text-ink-navy"
              >
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={onSignOut}
              className="py-3.5 text-left text-[15px] font-medium text-slate-700"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
