import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Clock, ShieldCheck, Lock } from 'lucide-react'
import { api } from '../api.js'
import { useAuth, useUI } from '../state.jsx'
import { Button, Spinner, Pill } from '../ui.jsx'
import { PRICE_LABEL, PRICE_TAGLINE } from '../config.js'

// Review a generated program and enroll (one-time payment via Dodo, per the backend).
export default function ProgramView() {
  const { id } = useParams()
  const { user } = useAuth()
  const { openAuth, toast } = useUI()
  const navigate = useNavigate()

  const [program, setProgram] = useState(null)
  const [error, setError] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { program } = await api.getProgram(id)
        if (alive) setProgram(program)
      } catch (err) {
        if (alive) setError(err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  async function onEnroll() {
    if (!user) {
      openAuth('login')
      return
    }
    setEnrolling(true)
    try {
      const res = await api.enroll(id)
      if (res.checkout_url) {
        window.location.href = res.checkout_url // hosted Dodo checkout
        return
      }
      if (res.alreadyEnrolled || res.devPaid) {
        if (res.devPaid) toast('Enrolled (dev mode — no charge).', 'success')
        navigate(`/course/${id}`)
        return
      }
      toast('Could not start enrollment. Try again.', 'error')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setEnrolling(false)
    }
  }

  if (error) {
    return (
      <div className="rounded-card border border-line bg-white px-6 py-12 text-center text-slate-500">
        {error}
      </div>
    )
  }
  if (!program) return <Spinner label="Loading program…" />

  return (
    <div className="mx-auto max-w-[820px]">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-500 hover:text-ink-navy"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Pill>{program.level}</Pill>
        <span className="inline-flex items-center gap-1 text-[13px] text-slate-500">
          <Clock size={14} /> {program.totalHours} hours
        </span>
      </div>
      <h1 className="mb-2 font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink-navy sm:text-[38px]">
        {program.title}
      </h1>
      <p className="mb-5 text-lg text-slate-700">{program.subtitle}</p>
      <p className="mb-8 max-w-[640px] leading-[1.65] text-slate-700">{program.summary}</p>

      {/* Skills */}
      {program.skills?.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-blue">
            Skills you'll gain
          </div>
          <div className="flex flex-wrap gap-2">
            {program.skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[13.5px] text-slate-700"
              >
                <Check size={14} className="text-blue" /> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Curriculum */}
      <div className="mb-8 rounded-panel border border-line bg-white p-6 shadow-card">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-blue">
          Curriculum
        </div>
        {(program.modules || []).map((m, i) => (
          <div key={i} className="border-b border-line py-3.5 last:border-b-0">
            <div className="flex items-start gap-3.5">
              <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg border border-line bg-slate-50 font-mono text-xs font-medium text-blue">
                {i + 1}
              </span>
              <div>
                <div className="font-semibold text-slate-900">{m.title}</div>
                <div className="text-[13.5px] text-slate-500">
                  {(m.lessons || []).join(' · ')}
                  {m.hours ? ` — ${m.hours}h` : ''}
                </div>
              </div>
            </div>
          </div>
        ))}
        {program.capstone?.title && (
          <div className="flex items-start gap-3.5 pt-4">
            <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg bg-gold/[0.16]">
              <ShieldCheck size={15} className="text-gold-text" />
            </span>
            <div>
              <div className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold-text">
                Capstone project
              </div>
              <div className="font-semibold text-slate-900">{program.capstone.title}</div>
              <div className="text-[13.5px] text-slate-500">{program.capstone.description}</div>
            </div>
          </div>
        )}
      </div>

      {/* Enroll */}
      <div className="rounded-panel border-[1.5px] border-blue bg-white p-6 shadow-pricing sm:p-8">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="font-display text-[34px] font-extrabold tracking-[-0.02em] text-ink-navy">
              {PRICE_LABEL} <span className="text-base font-semibold text-slate-400">one-time</span>
            </div>
            <div className="text-sm text-slate-500">{PRICE_TAGLINE}</div>
          </div>
          <Button size="lg" onClick={onEnroll} loading={enrolling}>
            <Lock size={16} /> {user ? 'Enroll & unlock the course' : 'Sign in to enroll'}
          </Button>
        </div>
        <ul className="mt-5 grid grid-cols-1 gap-2 text-[14px] text-slate-700 sm:grid-cols-2">
          {[
            'AI-tutored, focused study sessions',
            'A test Claude writes from your curriculum',
            'A verifiable credential on completion',
            'Lifetime access to this program',
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check size={16} className="flex-none text-blue" /> {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
