import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Award, Plus, ShieldCheck } from 'lucide-react'
import { api } from '../api.js'
import { useAuth, useUI } from '../state.jsx'
import { Button, Field, Input, Textarea, Spinner, Pill } from '../ui.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const { toast } = useUI()
  const navigate = useNavigate()

  const [programs, setPrograms] = useState(null)
  const [certs, setCerts] = useState([])
  const [goal, setGoal] = useState('')
  const [why, setWhy] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [p, c] = await Promise.all([api.myPrograms(), api.certificates()])
        if (!alive) return
        setPrograms(p.programs || [])
        setCerts(c.certificates || [])
      } catch (err) {
        if (alive) {
          setPrograms([])
          toast(err.message, 'error')
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [toast])

  async function onGenerate(e) {
    e.preventDefault()
    if (!goal.trim()) return
    setBusy(true)
    try {
      const { program } = await api.generateProgram({ goal, why })
      navigate(`/program/${program.id}`)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="mb-1.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-blue">
          Your dashboard
        </p>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink-navy sm:text-[34px]">
          Hi {user?.name?.split(' ')[0] || 'there'} — what do you want to master?
        </h1>
      </header>

      {/* New plan generator */}
      <section className="rounded-panel border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-blue">
          <Plus size={15} /> Build a new plan
        </div>
        <form onSubmit={onGenerate} className="flex flex-col gap-4">
          <Field label="What do you want to learn?">
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Train and ship a small language model"
              required
            />
          </Field>
          <Field label="Why? (optional — tailors your capstone)">
            <Textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={2}
              placeholder="e.g. I want to move into an ML engineering role"
            />
          </Field>
          <div>
            <Button type="submit" size="lg" loading={busy}>
              Generate my curriculum <ArrowRight size={18} />
            </Button>
          </div>
        </form>
      </section>

      {/* Programs */}
      <section>
        <h2 className="mb-4 font-display text-xl font-extrabold tracking-[-0.01em] text-ink-navy">
          Your programs
        </h2>
        {programs === null ? (
          <Spinner label="Loading your programs…" />
        ) : programs.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-white px-6 py-10 text-center text-slate-500">
            No programs yet. Generate your first plan above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {programs.map((p) => (
              <Link
                key={p.id}
                to={`/course/${p.id}`}
                className="group flex flex-col rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-pricing"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Pill>{p.level}</Pill>
                  <span className="text-[12.5px] text-slate-400">{p.totalHours}h</span>
                </div>
                <div className="mb-1.5 font-display text-lg font-bold tracking-[-0.01em] text-ink-navy">
                  {p.title}
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-slate-500">{p.subtitle}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-[14px] font-semibold text-blue">
                  Open <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Certificates */}
      {certs.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-extrabold tracking-[-0.01em] text-ink-navy">
            <Award size={20} className="text-gold-text" /> Your credentials
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {certs.map((c) => (
              <Link
                key={c.credId}
                to={`/verify/${c.credId}`}
                className="flex items-center gap-4 rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-pricing"
              >
                <ShieldCheck size={26} className="flex-none text-gold-text" />
                <div>
                  <div className="font-display text-base font-bold text-ink-navy">
                    {c.programTitle}
                  </div>
                  <div className="font-mono text-[12px] text-gold-text">{c.credId}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
