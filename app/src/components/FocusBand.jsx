import { Clock, Check, Lock } from 'lucide-react'

const points = [
  {
    icon: Clock,
    title: "A timer that can't be gamed",
    body: "Sessions run on the server clock — reloads and refreshes won't shorten them.",
  },
  {
    icon: Check,
    title: 'Honest streaks',
    body: 'Every completed session counts. Leave early and it breaks — no gaming the numbers.',
  },
  {
    icon: Lock,
    title: 'A distraction-free room',
    body: 'Minimal by design. Just your lesson, your tutor, and the time you committed.',
  },
]

export default function FocusBand() {
  return (
    <section className="bg-ink-navy px-5 py-[60px] sm:px-7 lg:py-24">
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-9 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="mb-[18px] font-mono text-xs font-medium uppercase tracking-[0.22em] text-sky">
            Locked in, on purpose
          </p>
          <h2 className="mb-5 font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-white lg:text-[38px]">
            Focus you can feel, not fake.
          </h2>
          <p className="mb-6 max-w-[460px] text-[17px] leading-[1.65] text-white/[0.72]">
            When a session starts, the app locks until your timer ends. The only way forward is
            through — the way real learning actually happens.
          </p>
          <p className="max-w-[440px] text-sm leading-[1.6] text-white/50">
            We're honest about the limits: no web app can trap you. We make leaving hard and
            visible, and keep your streak honest — focus stays your choice.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {points.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex items-start gap-3.5 rounded-btn border border-white/10 bg-white/5 px-5 py-[18px]"
            >
              <Icon
                size={20}
                strokeWidth={2}
                className="mt-0.5 flex-none text-gold"
              />
              <div>
                <div className="mb-1 font-display text-base font-bold text-white">{title}</div>
                <div className="text-sm leading-[1.5] text-white/60">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
