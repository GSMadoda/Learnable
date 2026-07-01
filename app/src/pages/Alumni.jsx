import { useEffect, useState, useCallback } from 'react'
import { Search, Linkedin, GraduationCap } from 'lucide-react'
import { api } from '../api.js'
import { useUI } from '../state.jsx'
import { Button, Input, Spinner } from '../ui.jsx'

// Alumni directory — credentialed, visible members. A paid benefit (requires auth).
export default function Alumni() {
  const { toast } = useUI()
  const [skill, setSkill] = useState('')
  const [query, setQuery] = useState('')
  const [data, setData] = useState(null)

  const search = useCallback(
    async (term) => {
      setData(null)
      try {
        const res = await api.alumni(term)
        setData(res)
      } catch (err) {
        setData({ alumni: [], total: 0 })
        toast(err.message, 'error')
      }
    },
    [toast],
  )

  useEffect(() => {
    search('')
  }, [search])

  function onSubmit(e) {
    e.preventDefault()
    setQuery(skill.trim())
    search(skill.trim())
  }

  return (
    <div>
      <header className="mb-6">
        <p className="mb-1.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-blue">
          Community
        </p>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink-navy sm:text-[34px]">
          Alumni directory
        </h1>
        <p className="mt-1 text-slate-500">Credentialed Learnable members, searchable by skill.</p>
      </header>

      <form onSubmit={onSubmit} className="mb-8 flex max-w-[520px] gap-2.5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Search a skill or program (e.g. Python)"
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {data === null ? (
        <Spinner label="Loading alumni…" />
      ) : data.alumni.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white px-6 py-12 text-center text-slate-500">
          {query ? `No alumni found for “${query}”.` : 'No alumni yet — be the first to earn a credential.'}
        </div>
      ) : (
        <>
          <div className="mb-4 text-[13px] text-slate-400">
            {data.total} member{data.total === 1 ? '' : 's'}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.alumni.map((a) => (
              <div key={a.id} className="rounded-card border border-line bg-white p-5 shadow-card">
                <div className="mb-3 flex items-center gap-3">
                  {a.avatar ? (
                    <img
                      src={a.avatar}
                      alt={a.name}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 font-display font-bold text-blue">
                      {a.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-display font-bold text-ink-navy">{a.name}</div>
                    {a.headline && (
                      <div className="truncate text-[13px] text-slate-500">{a.headline}</div>
                    )}
                  </div>
                </div>

                {a.education && (
                  <div className="mb-2 flex items-center gap-1.5 text-[13px] text-slate-500">
                    <GraduationCap size={14} className="text-slate-400" /> {a.education}
                  </div>
                )}

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {a.credentials.map((c, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-gold/[0.14] px-2.5 py-1 text-[12px] font-medium text-gold-text"
                    >
                      {c.programTitle}
                    </span>
                  ))}
                </div>

                {a.linkedin && (
                  <a
                    href={a.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue hover:underline"
                  >
                    <Linkedin size={14} /> LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
