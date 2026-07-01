import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  Sparkles,
  CreditCard,
  Award,
  CheckCircle2,
  Mail,
  Search,
  AlertCircle,
  BookOpen,
} from 'lucide-react'
import { api } from '../api.js'
import { useUI } from '../state.jsx'
import { Spinner, Input } from '../ui.jsx'

function ago(iso) {
  if (!iso) return '—'
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

// A learner needs a nudge if they're on a trial that's stalled or about to end.
const needsHelp = (r) =>
  r.status === 'trial' && (r.percent < 25 || (r.trialDaysLeft != null && r.trialDaysLeft <= 2))

function StatCard({ icon: Icon, label, value, tone = 'blue' }) {
  const tones = {
    blue: 'text-blue bg-blue-50',
    gold: 'text-gold-text bg-gold/[0.16]',
    slate: 'text-slate-500 bg-slate-100',
    navy: 'text-white bg-ink-navy',
  }
  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-card">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="font-display text-[26px] font-extrabold leading-none tracking-[-0.02em] text-ink-navy">
        {value}
      </div>
      <div className="mt-1 text-[13px] text-slate-500">{label}</div>
    </div>
  )
}

function StatusPill({ status, daysLeft }) {
  if (status === 'paid')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-blue-700">
        Paid
      </span>
    )
  if (status === 'trial')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gold/[0.16] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gold-text">
        Trial{daysLeft != null ? ` · ${daysLeft}d` : ''}
      </span>
    )
  if (status === 'signed_up')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
        Signed up
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">
      Expired
    </span>
  )
}

function outreach(r) {
  const first = (r.name || '').split(' ')[0] || 'there'
  let subject, body
  if (r.status === 'signed_up') {
    subject = 'Welcome to Learnable — need a hand getting started?'
    body = `Hi ${first},\n\nThanks for signing up to Learnable!${
      r.plansGenerated ? ' I saw you generated a plan' : ''
    } I'd love to help you pick a course and get going — is there anything you're looking to learn, or anything I can help with?\n\n— The Learnable team`
  } else {
    subject = `Learnable — how's "${r.program}" going?`
    body = `Hi ${first},\n\nI saw you started "${r.program}" on Learnable${
      r.percent ? ` and you're ${r.percent}% in` : ''
    }. I'd love to help you get the most out of it — is there anything you're stuck on or any feedback so far?\n\nHappy to answer anything.\n\n— The Learnable team`
  }
  return `mailto:${r.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default function Admin() {
  const { toast } = useUI()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await api.adminOverview()
        if (alive) setData(res)
      } catch (err) {
        if (alive) {
          setError(err.message)
          toast(err.message, 'error')
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [toast])

  const rows = data?.rows || []
  const attention = useMemo(() => rows.filter(needsHelp).length, [rows])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter === 'trial' && r.status !== 'trial') return false
      if (filter === 'paid' && r.status !== 'paid') return false
      if (filter === 'expired' && r.status !== 'trial_expired') return false
      if (filter === 'signedup' && r.status !== 'signed_up') return false
      if (filter === 'attention' && !needsHelp(r)) return false
      if (term && !`${r.name} ${r.email} ${r.program}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [rows, q, filter])

  if (error && !data)
    return (
      <div className="rounded-card border border-line bg-white px-6 py-12 text-center text-slate-500">
        {error}
      </div>
    )
  if (!data) return <Spinner label="Loading admin…" />

  const s = data.stats
  const chips = [
    { key: 'all', label: `All (${rows.length})` },
    { key: 'attention', label: `Needs help (${attention})` },
    { key: 'signedup', label: `Not started (${s.signedUp ?? 0})` },
    { key: 'trial', label: `Trials (${s.activeTrials})` },
    { key: 'paid', label: `Paid (${s.paid})` },
    { key: 'expired', label: `Expired (${s.expiredTrials})` },
  ]

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="mb-1.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-blue">
          Admin
        </p>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink-navy sm:text-[34px]">
          Who's learning — and where they're stuck
        </h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={BookOpen} label="Learners" value={s.learners} tone="blue" />
        <StatCard icon={Sparkles} label="Active trials" value={s.activeTrials} tone="gold" />
        <StatCard icon={CreditCard} label="Paid" value={s.paid} tone="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value={s.completed} tone="blue" />
        <StatCard icon={Award} label="Credentials" value={s.credentials} tone="gold" />
        <StatCard icon={Users} label="Sign-ups" value={s.users} tone="slate" />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={`rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors ${
                filter === c.key
                  ? 'border-blue bg-blue-50 text-blue-700'
                  : 'border-line bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-[280px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, program"
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white px-6 py-12 text-center text-slate-500">
          No learners match this view yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-line bg-white shadow-card">
          <table className="w-full min-w-[840px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                <th className="px-5 py-3 font-medium">Learner</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Last active</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const flag = needsHelp(r)
                return (
                  <tr key={i} className="border-b border-line last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {flag && (
                          <AlertCircle size={15} className="flex-none text-gold-text" title="Needs a nudge" />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-ink-navy">{r.name}</div>
                          <div className="truncate text-[12.5px] text-slate-400">{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {r.program ? (
                        <span className="text-slate-700">{r.program}</span>
                      ) : (
                        <span className="text-slate-400">
                          {r.plansGenerated
                            ? `${r.plansGenerated} plan${r.plansGenerated === 1 ? '' : 's'} generated`
                            : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={r.status} daysLeft={r.trialDaysLeft} />
                    </td>
                    <td className="px-4 py-3.5">
                      {r.status === 'signed_up' ? (
                        <span className="text-[12.5px] text-slate-400">Not started</span>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${r.percent >= 100 ? 'bg-gold' : 'bg-blue'}`}
                              style={{ width: `${r.percent}%` }}
                            />
                          </div>
                          <span className="whitespace-nowrap text-[12.5px] text-slate-500">
                            {r.percent}% · {r.lessonsDone}/{r.totalLessons}
                            {r.capstoneDone ? ' + cap' : ''}
                          </span>
                          {r.hasCredential && <Award size={14} className="text-gold-text" title="Credentialed" />}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-[13px] text-slate-500">
                      {ago(r.lastActive || r.startedAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <a
                        href={outreach(r)}
                        className="inline-flex items-center gap-1.5 rounded-btn border border-line px-3 py-1.5 text-[13px] font-semibold text-ink-navy transition-colors hover:bg-blue-50"
                      >
                        <Mail size={14} /> Email
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
