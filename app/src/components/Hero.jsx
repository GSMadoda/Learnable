function SessionMock() {
  return (
    <div className="overflow-hidden rounded-panel border border-white/10 bg-ink-navy shadow-mock">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="h-[9px] w-[9px] rounded-[3px] bg-gold" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
            Module 3 · Session 2
          </span>
        </div>
        <span className="font-mono text-base font-medium tracking-[0.04em] text-gold">24:31</span>
      </div>

      {/* Body: lesson + tutor */}
      <div className="grid grid-cols-[1.5fr_1fr]">
        {/* Lesson pane */}
        <div className="border-r border-white/10 px-[22px] pb-6 pt-[22px]">
          <div className="mb-3.5 font-display text-[17px] font-bold tracking-[-0.01em] text-white">
            Working with APIs
          </div>
          <div className="mb-[9px] h-2 w-full rounded bg-white/[0.12]" />
          <div className="mb-[9px] h-2 w-[94%] rounded bg-white/[0.12]" />
          <div className="mb-[18px] h-2 w-[88%] rounded bg-white/[0.12]" />
          <div className="rounded-control border border-sky/25 bg-sky/[0.12] px-[13px] py-[11px]">
            <div className="mb-[7px] h-[7px] w-[70%] rounded bg-white/[0.28]" />
            <div className="h-[7px] w-[52%] rounded bg-white/[0.18]" />
          </div>
        </div>

        {/* Tutor pane */}
        <div className="flex flex-col p-4">
          <div className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/40">
            Tutor
          </div>
          <div className="mb-[9px] max-w-[88%] self-end rounded-[12px_12px_3px_12px] bg-blue px-[11px] py-2 text-[11px] leading-[1.45] text-white">
            What's a status code?
          </div>
          <div className="mb-auto max-w-[92%] self-start rounded-[12px_12px_12px_3px] bg-white/[0.09] px-[11px] py-[9px] text-[11px] leading-[1.5] text-white/[0.82]">
            It's the server's short reply about your request — 200 means OK
            <span className="ml-0.5 inline-block h-3 w-1.5 -translate-y-[2px] animate-blink bg-sky align-middle" />
          </div>
          <div className="mt-3 rounded-control border border-white/[0.18] px-[11px] py-[9px] text-[11px] text-white/40">
            Ask the tutor…
          </div>
        </div>
      </div>

      {/* Locked footer strip */}
      <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-gold/[0.11] p-2.5">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-gold" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
          Locked · stay until the timer ends
        </span>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section
      id="top"
      className="relative bg-[linear-gradient(180deg,#fff_0%,var(--color-paper)_100%)]"
    >
      {/* Soft blue radial glow, top-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-[120px] h-[640px] w-[640px]"
        style={{
          background:
            'radial-gradient(circle, rgba(37,99,235,.12) 0%, rgba(37,99,235,0) 62%)',
        }}
      />
      <div className="relative mx-auto grid max-w-[1120px] items-center gap-9 px-5 pb-16 pt-12 sm:px-7 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-[88px] lg:pt-[76px]">
        {/* Copy */}
        <div>
          <p className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-blue">
            The focus app for learning
          </p>
          <h1 className="mb-[22px] font-display text-[32px] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink-navy sm:text-[38px] lg:text-[56px]">
            Commit to the session. Learn until the timer ends.
          </h1>
          <p className="mb-[30px] max-w-[480px] text-[17px] leading-[1.6] text-slate-700 sm:text-[19px]">
            Pick any subject. Claude builds your curriculum, tutors you in real time, and locks
            you into focused sessions — then tests you and issues a credential you can point to.
          </p>
          <div className="flex flex-wrap items-center gap-3.5">
            <a
              href="#start"
              className="rounded-btn bg-blue px-[26px] py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-hover active:bg-blue-press"
            >
              Start free trial
            </a>
            <a
              href="#product"
              className="rounded-btn border border-line bg-white px-6 py-[13px] text-base font-semibold text-ink-navy transition-colors hover:bg-blue-50"
            >
              Watch a session
            </a>
          </div>
          <p className="mt-[18px] text-sm text-slate-500">7-day free trial. No card to start.</p>
        </div>

        <SessionMock />
      </div>
    </section>
  )
}
