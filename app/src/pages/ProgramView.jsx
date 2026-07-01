import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Check, Clock, ShieldCheck, Lock, Sparkles } from 'lucide-react'
import { api } from '../api.js'
import { useAuth, useUI } from '../state.jsx'
import { Button, Spinner, Pill } from '../ui.jsx'
import { PRICE_LABEL, PRICE_TAGLINE, TRIAL_DAYS } from '../config.js'

// Review a generated program, then start a free trial or pay to enroll.
export default function ProgramView() {
  const { id } = useParams()
  const { user } = useAuth()
  const { openAuth, toast } = useUI()
  const navigate = useNavigate()

  const [program, setProgram] = useState(null)
  const [status, setStatus] = useState(null) // courseState (when signed in)
  const [statusLoaded, setStatusLoaded] = useState(false)
  const [error, setError] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [trialing, setTrialing] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        if (user) {
          // courseState returns the program plus this user's enrollment status.
          const s = await api.courseState(id)
          if (!alive) return
          setProgram(s.program)
          setStatus(s)
        } else {
          const { program } = await api.getProgram(id)
          if (alive) setProgram(program)
        }
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setStatusLoaded(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [id, user])

  async function onEnroll() {
    if (!user) {
      openAuth('login')
      return
    }
    setEnrolling(true)
    try {
      const res = await api.enroll(id)
      if (res.checkout_url) {
        sessionStorage.setItem('lrn_pending_program', String(id))
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

  async function onTrial() {
    if (!user) {
      openAuth('signup')
      return
    }
    setTrialing(true)
    try {
      const res = await api.startTrial(id)
      if (res.trial || res.alreadyEnrolled) {
        if (res.trial) toast('Your free trial has started.', 'success')
        navigate(`/course/${id}`)
        return
      }
      toast('Could not start your trial. Try again.', 'error')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setTrialing(false)
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

  const enrolled = status?.enrolled
  const trialEnded = status?.trialExpired
  // Offer the trial to signed-out visitors and to signed-in users who still have it.
  const canTrial = !user || (statusLoaded && !enrolled && status?.trialAvailable && !trialEnded)

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

      {/* Enroll / Trial */}
      <div className="rounded-panel border-[1.5px] border-blue bg-white p-6 shadow-pricing sm:p-8">
        {enrolled ? (
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="font-display text-2xl font-extrabold text-ink-navy">You're in.</div>
              <div className="text-sm text-slate-500">
                {status.paid
                  ? 'Full access — lifetime.'
                  : `Free trial · ${status.trial?.daysLeft} day${status.trial?.daysLeft === 1 ? '' : 's'} left`}
              </div>
            </div>
            <Button as={Link} to={`/course/${id}`} size="lg">
              Continue to course
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                {canTrial ? (
                  <>
                    <div className="font-display text-[34px] font-extrabold tracking-[-0.02em] text-ink-navy">
                      {TRIAL_DAYS} days free
                    </div>
                    <div className="text-sm text-slate-500">
                      Full access. Then {PRICE_LABEL} one-time to keep it and earn the credential.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-display text-[34px] font-extrabold tracking-[-0.02em] text-ink-navy">
                      {PRICE_LABEL} <span className="text-base font-semibold text-slate-400">one-time</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {trialEnded ? 'Your free trial has ended — unlock to continue.' : PRICE_TAGLINE}
                    </div>
                  </>
                )}
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                {canTrial && (
                  <Button size="lg" onClick={onTrial} loading={trialing} className="w-full sm:w-auto">
                    <Sparkles size={16} /> {user ? `Start ${TRIAL_DAYS}-day free trial` : 'Start free trial'}
                  </Button>
                )}
                <Button
                  size={canTrial ? 'sm' : 'lg'}
                  variant={canTrial ? 'ghost' : 'primary'}
                  onClick={onEnroll}
                  loading={enrolling}
                  className="w-full sm:w-auto"
                >
                  {!canTrial && <Lock size={16} />}
                  {canTrial ? `Or pay ${PRICE_LABEL} now` : user ? 'Enroll & unlock the course' : `Pay ${PRICE_LABEL}`}
                </Button>
              </div>
            </div>
            <ul className="mt-5 grid grid-cols-1 gap-2 text-[14px] text-slate-700 sm:grid-cols-2">
              {[
                'AI-tutored, focused study sessions',
                'A test Claude writes from your curriculum',
                'A verifiable credential when you enroll',
                'Lifetime access once you pay',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={16} className="flex-none text-blue" /> {f}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
