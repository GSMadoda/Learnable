export default function ClosingCTA({ variant = 'navy' }) {
  const bg =
    variant === 'blue'
      ? 'bg-[linear-gradient(135deg,#2563EB,#1E3A8A)]'
      : 'bg-ink-navy'

  return (
    <section id="start" className="px-5 pb-[100px] pt-5 sm:px-7">
      <div
        className={`mx-auto max-w-[1000px] rounded-hero px-6 py-11 text-center sm:px-10 sm:py-16 ${bg}`}
      >
        <h2 className="mb-[18px] font-display text-[32px] font-extrabold leading-[1.04] tracking-[-0.03em] text-white lg:text-[44px]">
          Start learning something real.
        </h2>
        <p className="mx-auto mb-8 max-w-[440px] text-lg leading-[1.6] text-white/[0.78]">
          One skill. Five modules. One project. Learn it, and prove it — starting today.
        </p>
        <a
          href="#"
          className="inline-block rounded-btn bg-white px-[30px] py-[15px] text-base font-semibold text-ink-navy transition-transform hover:scale-[1.03]"
        >
          Start your free trial
        </a>
        <p className="mt-5 font-mono text-xs tracking-[0.08em] text-white/60">
          Learn it. Prove it.
        </p>
      </div>
    </section>
  )
}
