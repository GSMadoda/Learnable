import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CircleDot,
  Clock,
  Lock,
  PlayCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { api } from '../api.js'
import { useUI } from '../state.jsx'
import { Button, Spinner, Textarea } from '../ui.jsx'

const fmt = (secs) =>
  `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

export default function Course() {
  const { id } = useParams()
  const { toast } = useUI()
  const navigate = useNavigate()

  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null) // { moduleIdx, lessonIdx, title } | { capstone:true }

  const load = useCallback(async () => {
    const s = await api.courseState(id)
    setState(s)
    return s
  }, [id])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch (err) {
        if (alive) setError(err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [load])

  const onStudyUpdate = useCallback((partial) => {
    setState((s) => (s ? { ...s, study: { ...s.study, ...partial } } : s))
  }, [])

  const onLessonComplete = useCallback(async () => {
    try {
      await load()
    } catch {
      /* keep current state */
    }
  }, [load])

  if (error) {
    return (
      <div className="rounded-card border border-line bg-white px-6 py-12 text-center text-slate-500">
        {error}
      </div>
    )
  }
  if (!state) return <Spinner label="Loading your course…" />

  // Not enrolled → send to the program page to enroll.
  if (!state.enrolled) {
    return (
      <div className="mx-auto max-w-[560px] rounded-panel border border-line bg-white p-8 text-center shadow-card">
        <Lock size={28} className="mx-auto mb-4 text-blue" />
        <h1 className="mb-2 font-display text-2xl font-extrabold text-ink-navy">
          {state.program.title}
        </h1>
        <p className="mb-6 text-slate-500">Enroll to unlock the lessons, tutor, and credential.</p>
        <Button size="lg" onClick={() => navigate(`/program/${id}`)}>
          View & enroll
        </Button>
      </div>
    )
  }

  const { program, study, completed = [], total, lessonsDone, capstoneDone, allDone, credId } = state
  const doneSet = new Set(completed)
  const progressPct = total ? Math.round(((lessonsDone + (capstoneDone ? 1 : 0)) / (total + 1)) * 100) : 0

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/app')}
        className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-500 hover:text-ink-navy"
      >
        <ArrowLeft size={16} /> Dashboard
      </button>

      <header className="mb-6">
        <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink-navy sm:text-[32px]">
          {program.title}
        </h1>
        <p className="text-slate-500">{program.subtitle}</p>
      </header>

      {allDone && credId && (
        <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-panel border border-gold/40 bg-gold/[0.08] p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck size={26} className="text-gold-text" />
            <div>
              <div className="font-display font-bold text-ink-navy">Credential earned</div>
              <div className="font-mono text-[12px] text-gold-text">{credId}</div>
            </div>
          </div>
          <Button as={Link} to={`/verify/${credId}`} variant="navy" size="sm">
            View credential
          </Button>
        </div>
      )}

      <StudyMeter study={study} />

      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-1.5 flex items-center justify-between text-[13px] text-slate-500">
          <span>
            {lessonsDone}/{total} lessons{capstoneDone ? ' · capstone done' : ''}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <LessonList
          program={program}
          doneSet={doneSet}
          capstoneDone={capstoneDone}
          selected={selected}
          onSelect={setSelected}
        />
        <div>
          {!selected ? (
            <div className="rounded-panel border border-dashed border-line bg-white px-6 py-16 text-center text-slate-500">
              <PlayCircle size={30} className="mx-auto mb-3 text-blue" />
              Pick a lesson to begin your session.
            </div>
          ) : selected.capstone ? (
            <CapstonePanel
              program={program}
              id={id}
              done={capstoneDone}
              onDone={onLessonComplete}
            />
          ) : (
            <LessonPanel
              key={`${selected.moduleIdx}-${selected.lessonIdx}`}
              id={id}
              selected={selected}
              done={doneSet.has(`${selected.moduleIdx}-${selected.lessonIdx}`)}
              onStudyUpdate={onStudyUpdate}
              onComplete={onLessonComplete}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function StudyMeter({ study }) {
  if (!study) return null
  const pct = Math.min(100, Math.round((study.minutes / study.required) * 100))
  const paused = study.status === 'paused'
  return (
    <div
      className={`mb-6 rounded-panel border p-5 ${
        paused ? 'border-gold/50 bg-gold/[0.08]' : 'border-line bg-white shadow-card'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-blue">
          <Clock size={14} /> Study window
        </div>
        <div className="text-[13px] text-slate-500">
          {paused ? (
            <span className="font-semibold text-gold-text">
              Paused — study {study.required} min to reactivate
            </span>
          ) : (
            <span>
              {study.minutes}/{study.required} min · {study.daysLeft} day
              {study.daysLeft === 1 ? '' : 's'} left in this window
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${paused ? 'bg-gold' : 'bg-blue'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function LessonList({ program, doneSet, capstoneDone, selected, onSelect }) {
  return (
    <aside className="rounded-panel border border-line bg-white p-3 shadow-card">
      {(program.modules || []).map((m, mi) => (
        <div key={mi} className="mb-2 last:mb-0">
          <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
            {m.title}
          </div>
          {(m.lessons || []).map((title, li) => {
            const key = `${mi}-${li}`
            const isDone = doneSet.has(key)
            const isSel = selected && selected.moduleIdx === mi && selected.lessonIdx === li
            return (
              <button
                key={li}
                type="button"
                onClick={() => onSelect({ moduleIdx: mi, lessonIdx: li, title })}
                className={`flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-[14px] transition-colors ${
                  isSel ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isDone ? (
                  <Check size={15} className="flex-none text-blue" />
                ) : (
                  <CircleDot size={15} className="flex-none text-slate-300" />
                )}
                <span className={isDone ? 'text-slate-500' : ''}>{title}</span>
              </button>
            )
          })}
        </div>
      ))}
      {program.capstone?.title && (
        <button
          type="button"
          onClick={() => onSelect({ capstone: true })}
          className={`mt-2 flex w-full items-center gap-2.5 rounded-control border-t border-line px-3 py-3 text-left text-[14px] transition-colors ${
            selected?.capstone ? 'bg-gold/[0.12]' : 'hover:bg-slate-50'
          }`}
        >
          {capstoneDone ? (
            <Check size={15} className="flex-none text-gold-text" />
          ) : (
            <ShieldCheck size={15} className="flex-none text-gold-text" />
          )}
          <span className="font-semibold text-gold-text">Capstone project</span>
        </button>
      )}
    </aside>
  )
}

function LessonPanel({ id, selected, done, onStudyUpdate, onComplete }) {
  const { toast } = useUI()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const savedRef = useRef(done)

  // Load lesson content
  useEffect(() => {
    let alive = true
    setLesson(null)
    setError('')
    ;(async () => {
      try {
        const { lesson } = await api.lesson(id, selected.moduleIdx, selected.lessonIdx)
        if (alive) setLesson(lesson)
      } catch (err) {
        if (alive) setError(err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [id, selected.moduleIdx, selected.lessonIdx])

  // Session timer + study heartbeat (one heartbeat = +1 min on the server).
  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000)
    const beat = setInterval(async () => {
      try {
        const res = await api.heartbeat(id)
        onStudyUpdate({ status: res.status, minutes: res.minutes, required: res.required })
      } catch {
        /* ignore transient heartbeat errors */
      }
    }, 60000)
    return () => {
      clearInterval(tick)
      clearInterval(beat)
    }
  }, [id, onStudyUpdate])

  if (error) {
    return (
      <div className="rounded-panel border border-line bg-white px-6 py-12 text-center text-slate-500">
        {error}
      </div>
    )
  }
  if (!lesson) return <Spinner label="Preparing your lesson…" />

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-panel border border-line bg-white p-6 shadow-card sm:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold tracking-[-0.01em] text-ink-navy">
            {selected.title}
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-navy px-3 py-1 font-mono text-[12px] text-gold">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-gold" />
            {fmt(seconds)}
          </span>
        </div>

        <p className="mb-5 whitespace-pre-line leading-[1.7] text-slate-700">{lesson.reading}</p>

        {lesson.videoUrl && (
          <a
            href={lesson.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-4 inline-flex items-center gap-2 rounded-btn border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink-navy transition-colors hover:bg-blue-50"
          >
            <PlayCircle size={16} className="text-blue" /> Watch a tutorial
          </a>
        )}

        {lesson.activity && (
          <div className="rounded-control border border-sky/30 bg-blue-50 px-4 py-3 text-[14.5px] text-slate-700">
            <span className="font-semibold text-ink-navy">Try it: </span>
            {lesson.activity}
          </div>
        )}
      </div>

      {Array.isArray(lesson.quiz) && lesson.quiz.length > 0 && (
        <Quiz
          quiz={lesson.quiz}
          lessonKey={`${selected.moduleIdx}-${selected.lessonIdx}`}
          alreadyDone={savedRef.current}
          onSubmit={async (score) => {
            try {
              await api.saveProgress(id, `${selected.moduleIdx}-${selected.lessonIdx}`, score)
              savedRef.current = true
              toast('Lesson complete.', 'success')
              onComplete()
            } catch (err) {
              toast(err.message, 'error')
            }
          }}
        />
      )}

      <TutorChat id={id} lessonTitle={selected.title} />
    </div>
  )
}

function Quiz({ quiz, lessonKey, alreadyDone, onSubmit }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  const allAnswered = quiz.every((_, i) => answers[i] !== undefined)
  const correct = quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0)

  async function submit() {
    setBusy(true)
    setSubmitted(true)
    await onSubmit(Math.round((correct / quiz.length) * 100))
    setBusy(false)
  }

  return (
    <div className="rounded-panel border border-line bg-white p-6 shadow-card sm:p-7">
      <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-blue">
        <Sparkles size={14} /> Check your understanding
        {alreadyDone && <span className="text-slate-400">· completed</span>}
      </div>
      <div className="flex flex-col gap-5">
        {quiz.map((q, i) => (
          <div key={i}>
            <div className="mb-2 font-semibold text-slate-900">
              {i + 1}. {q.q}
            </div>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const chosen = answers[i] === oi
                const isCorrect = q.answer === oi
                let cls = 'border-line bg-white hover:bg-slate-50'
                if (submitted) {
                  if (isCorrect) cls = 'border-blue bg-blue-50 text-blue-700'
                  else if (chosen) cls = 'border-line bg-slate-50 text-slate-400 line-through'
                } else if (chosen) {
                  cls = 'border-blue bg-blue-50 text-blue-700'
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                    className={`rounded-control border px-3.5 py-2.5 text-left text-[14.5px] transition-colors ${cls}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-4">
        <Button onClick={submit} disabled={!allAnswered || submitted} loading={busy}>
          {submitted ? 'Submitted' : 'Submit & complete'}
        </Button>
        {submitted && (
          <span className="text-[14px] font-semibold text-slate-700">
            {correct}/{quiz.length} correct
          </span>
        )}
      </div>
    </div>
  )
}

function TutorChat({ id, lessonTitle }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const { reply } = await api.tutor(id, next, lessonTitle)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: `⚠️ ${err.message}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col rounded-panel border border-line bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-blue">
        <Sparkles size={14} /> AI tutor
      </div>
      <div className="flex max-h-[340px] min-h-[120px] flex-col gap-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <p className="text-[14px] text-slate-400">
            Stuck on “{lessonTitle}”? Ask the tutor anything about this lesson.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-line rounded-panel px-3.5 py-2.5 text-[14px] leading-[1.5] ${
              m.role === 'user'
                ? 'self-end rounded-br-sm bg-blue text-white'
                : 'self-start rounded-bl-sm bg-slate-50 text-slate-800'
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && <div className="self-start text-[13px] text-slate-400">Tutor is thinking…</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
        <Textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(e)
            }
          }}
          placeholder="Ask the tutor…"
          className="min-h-[44px] resize-none"
        />
        <Button type="submit" loading={busy} disabled={!input.trim()} className="h-[44px]">
          <Send size={16} />
        </Button>
      </form>
    </div>
  )
}

function CapstonePanel({ program, id, done, onDone }) {
  const { toast } = useUI()
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await api.submitCapstone(id)
      toast('Capstone marked complete.', 'success')
      onDone()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-panel border border-gold/40 bg-white p-6 shadow-card sm:p-7">
      <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-gold-text">
        <ShieldCheck size={15} /> Capstone project
      </div>
      <h2 className="mb-2 font-display text-xl font-extrabold text-ink-navy">
        {program.capstone?.title}
      </h2>
      <p className="mb-6 leading-[1.7] text-slate-700">{program.capstone?.description}</p>
      <p className="mb-6 rounded-control border border-line bg-slate-50 px-4 py-3 text-[14px] text-slate-600">
        Build and finish your capstone, then mark it complete. Once every lesson and the capstone
        are done, your credential is issued automatically.
      </p>
      <Button onClick={submit} loading={busy} disabled={done} variant={done ? 'ghost' : 'primary'}>
        {done ? (
          <>
            <Check size={16} /> Capstone complete
          </>
        ) : (
          'Mark capstone complete'
        )}
      </Button>
    </div>
  )
}
