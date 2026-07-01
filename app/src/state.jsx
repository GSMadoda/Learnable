// App-wide state: authenticated user, server feature flags (/api/config), toasts,
// and control of the shared auth modal. Marketing CTAs and app pages both read this.
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { api } from './api.js'

const AuthCtx = createContext(null)
const UICtx = createContext(null)

export function useAuth() {
  return useContext(AuthCtx)
}
export function useUI() {
  return useContext(UICtx)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [config, setConfig] = useState({ google: false, email: false })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.me()
      setUser(user || null)
      return user || null
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [meRes, cfgRes] = await Promise.allSettled([api.me(), api.config()])
        if (!alive) return
        if (meRes.status === 'fulfilled') setUser(meRes.value.user || null)
        if (cfgRes.status === 'fulfilled') setConfig(cfgRes.value || { google: false, email: false })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* ignore */
    }
    setUser(null)
  }, [])

  return (
    <AuthCtx.Provider value={{ user, setUser, config, loading, refresh, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function UIProvider({ children }) {
  // Auth modal: { mode: 'login'|'signup'|'forgot'|'reset', token? } | null
  const [auth, setAuth] = useState(null)
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const openAuth = useCallback((mode = 'login', extra = {}) => {
    setAuth({ mode, ...extra })
  }, [])
  const closeAuth = useCallback(() => setAuth(null), [])

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])
  const toast = useCallback(
    (message, type = 'info') => {
      const id = nextId.current++
      setToasts((list) => [...list, { id, message, type }])
      setTimeout(() => dismissToast(id), 5000)
      return id
    },
    [dismissToast],
  )

  return (
    <UICtx.Provider value={{ auth, openAuth, closeAuth, toast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </UICtx.Provider>
  )
}

function Toaster({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onDismiss(t.id)}
          className={`pointer-events-auto w-full max-w-[380px] rounded-btn px-4 py-3 text-left text-sm font-medium shadow-pricing transition-colors ${
            t.type === 'error'
              ? 'bg-ink-navy text-white'
              : t.type === 'success'
                ? 'bg-blue text-white'
                : 'border border-line bg-white text-ink-navy'
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
