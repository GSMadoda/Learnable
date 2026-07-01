import { MessageSquare, BookOpen, Lock, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'Real-time tutor',
    body: "Ask Claude anything the moment you're stuck. Explanations, examples, and materials, generated for you.",
    gold: false,
  },
  {
    icon: BookOpen,
    title: 'Personal curriculum',
    body: 'Tell us the subject and your months. Claude maps a complete path and schedules it around your days.',
    gold: false,
  },
  {
    icon: Lock,
    title: 'Locked sessions',
    body: 'Start the timer and the interface locks. No tabs, no exits — just the one thing you sat down to do.',
    gold: false,
  },
  {
    icon: ShieldCheck,
    title: 'Verifiable credential',
    body: 'Pass the course test and earn a certificate with a unique ID and a public page anyone can check.',
    gold: true,
  },
]

export default function Features() {
  return (
    <section
      id="product"
      className="border-y border-line bg-white px-5 py-[60px] sm:px-7 lg:py-[92px]"
    >
      <div className="mx-auto max-w-[1120px]">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.22em] text-blue">
          What's inside
        </p>
        <h2 className="mb-3.5 max-w-[640px] font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.025em] text-ink-navy lg:text-[40px]">
          Everything you need to actually finish.
        </h2>
        <p className="mb-11 max-w-[560px] text-lg leading-[1.6] text-slate-700">
          Four parts working together — from the first plan to the final credential.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body, gold }) => (
            <div
              key={title}
              className="rounded-card border border-line bg-white p-6 shadow-card"
            >
              <div
                className={`mb-[18px] flex h-11 w-11 items-center justify-center rounded-xl ${
                  gold ? 'bg-gold/[0.16]' : 'bg-blue-50'
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={2}
                  className={gold ? 'text-gold-text' : 'text-blue'}
                />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold tracking-[-0.01em] text-ink-navy">
                {title}
              </h3>
              <p className="text-[14.5px] leading-[1.55] text-slate-700">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
