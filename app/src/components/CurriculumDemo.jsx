import { useState } from 'react'
import { Clock, ShieldCheck } from 'lucide-react'
import { curricula, subjectOrder } from '../data/curricula.js'

export default function CurriculumDemo({ defaultSubject = 'python' }) {
  const [activeId, setActiveId] = useState(
    curricula[defaultSubject] ? defaultSubject : 'python',
  )
  const plan = curricula[activeId]

  return (
    <section id="build" className="px-5 py-[60px] sm:px-7 lg:py-24">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-11 text-center">
          <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.22em] text-blue">
            See it build your plan
          </p>
          <h2 className="mx-auto mb-3.5 max-w-[620px] font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.025em] text-ink-navy lg:text-[40px]">
            Name a subject. Get a full path in seconds.
          </h2>
          <p className="mx-auto max-w-[520px] text-lg leading-[1.6] text-slate-700">
            Five focused modules and one capstone project — the same structure behind every
            Learnable credential.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 rounded-panel border border-line bg-white p-6 shadow-card sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          {/* Picker */}
          <div>
            <div className="mb-1.5 text-[15px] text-slate-500">I want to learn…</div>
            <div className="mb-[22px] font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink-navy">
              {plan.label}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {subjectOrder.map((id) => {
                const active = id === activeId
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveId(id)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-full border px-4 py-[9px] text-[14.5px] font-semibold transition-all ${
                      active
                        ? 'border-blue bg-blue-50 text-blue-700'
                        : 'border-line bg-white text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    {curricula[id].label}
                  </button>
                )
              })}
            </div>
            <div className="mt-[26px] flex items-center gap-2 text-[13.5px] text-slate-500">
              <Clock size={15} strokeWidth={2} className="text-slate-400" />
              <span>{plan.goal}</span>
            </div>
          </div>

          {/* Generated curriculum */}
          <div className="rounded-[16px] border border-line bg-slate-50 px-6 py-[22px]">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-blue">
              Generated curriculum
            </div>
            {plan.modules.map((title, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 border-b border-line py-[11px]"
              >
                <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg border border-line bg-white font-mono text-xs font-medium text-blue">
                  {i + 1}
                </span>
                <span className="pt-[3px] text-[15px] font-medium leading-[1.4] text-slate-900">
                  {title}
                </span>
              </div>
            ))}
            <div className="flex items-start gap-3.5 pb-0.5 pt-3.5">
              <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg bg-gold/[0.16]">
                <ShieldCheck size={15} strokeWidth={2.2} className="text-gold-text" />
              </span>
              <div className="pt-0.5">
                <div className="mb-[3px] font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-gold-text">
                  Capstone project
                </div>
                <div className="text-[15px] font-medium leading-[1.4] text-slate-900">
                  {plan.capstone}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
