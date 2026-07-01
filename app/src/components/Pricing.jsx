import { useNavigate } from 'react-router-dom'
import { useAuth, useUI } from '../state.jsx'
import { PRICE_LABEL } from '../config.js'

const tiers = [
  {
    label: 'Explore',
    price: 'Free',
    suffix: null,
    sub: 'no card needed',
    body: ['Generate any curriculum.', 'Preview all modules & the capstone.'],
    highlight: false,
  },
  {
    label: 'Enroll',
    price: PRICE_LABEL,
    suffix: null,
    sub: 'one-time, per program',
    body: ['AI tutor + locked focus sessions.', 'Test, credential & lifetime access.'],
    highlight: true,
    badge: 'Most popular',
  },
  {
    label: 'Credential',
    price: 'Included',
    suffix: null,
    sub: 'when you finish',
    body: ['A unique, verifiable ID.', 'A public page — yours forever.'],
    highlight: false,
  },
]

export default function Pricing() {
  const { user } = useAuth()
  const { openAuth } = useUI()
  const navigate = useNavigate()
  const start = () => (user ? navigate('/app') : openAuth('signup'))

  return (
    <section id="pricing" className="px-5 py-[60px] sm:px-7 lg:py-24">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-12 text-center">
          <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.22em] text-blue">
            Pricing
          </p>
          <h2 className="mx-auto mb-3.5 max-w-[560px] font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.025em] text-ink-navy lg:text-[40px]">
            Plan for free. Pay once per program.
          </h2>
          <p className="mx-auto max-w-[500px] text-lg leading-[1.6] text-slate-700">
            Build any curriculum at no cost. Enroll when you're ready — one payment, and that
            program (with its credential) is yours to keep.
          </p>
        </div>

        <div className="mx-auto grid max-w-[900px] grid-cols-1 gap-5 sm:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.label}
              className={`relative flex flex-col rounded-card bg-white px-[26px] py-[30px] ${
                t.highlight
                  ? 'border-[1.5px] border-blue shadow-pricing'
                  : 'border border-line shadow-card'
              }`}
            >
              {t.badge && (
                <div className="absolute -top-[11px] left-[26px] rounded-full bg-blue px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white">
                  {t.badge}
                </div>
              )}
              <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-blue">
                {t.label}
              </div>
              <div className="mb-0.5 font-display text-[40px] font-extrabold tracking-[-0.02em] text-ink-navy">
                {t.price}
                {t.suffix && (
                  <span className="text-lg font-semibold text-slate-400">{t.suffix}</span>
                )}
              </div>
              <div className="mb-[22px] text-sm text-slate-500">{t.sub}</div>
              <div className="text-[14.5px] leading-[1.7] text-slate-700">
                {t.body.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              {t.highlight && (
                <button
                  type="button"
                  onClick={start}
                  className="mt-6 w-full rounded-btn bg-blue px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-blue-hover active:bg-blue-press"
                >
                  Start free
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
