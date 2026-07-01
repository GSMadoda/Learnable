import { Check } from 'lucide-react'
import { GoldSeal } from './Brand.jsx'

const proofPoints = [
  'Every certificate has a unique ID',
  'A public page anyone can check',
  'Yours to keep, forever',
]

function Certificate() {
  return (
    <div className="overflow-hidden rounded-panel border border-line bg-white shadow-cert">
      <div className="h-1.5 bg-[linear-gradient(90deg,var(--color-blue),var(--color-sky))]" />
      <div className="px-6 py-8 text-center sm:px-[34px] sm:pb-[30px] sm:pt-[34px]">
        <GoldSeal size={56} className="mx-auto mb-[18px] block" />
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
          Certificate of mastery
        </div>
        <div className="mb-1.5 text-[13px] text-slate-500">This certifies that</div>
        <div className="mb-1.5 font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink-navy">
          Alex Rivera
        </div>
        <div className="mb-[26px] text-sm text-slate-700">
          has mastered <strong className="text-ink-navy">Python programming</strong>
        </div>
        <div className="flex justify-center gap-10 border-t border-line pt-[18px]">
          <div>
            <div className="mb-[5px] font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">
              Credential ID
            </div>
            <div className="font-mono text-[13px] font-medium text-gold-text">LRN-7K2A-9X4D</div>
          </div>
          <div>
            <div className="mb-[5px] font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">
              Verify at
            </div>
            <div className="font-mono text-[13px] font-medium text-blue">learnable.app/v</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Credential() {
  return (
    <section className="border-b border-line bg-white px-5 py-[60px] sm:px-7 lg:py-24">
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-9 lg:grid-cols-2 lg:gap-14">
        <Certificate />
        <div>
          <p className="mb-[18px] font-mono text-xs font-medium uppercase tracking-[0.22em] text-blue">
            Prove it, publicly
          </p>
          <h2 className="mb-5 font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.025em] text-ink-navy lg:text-[40px]">
            A credential you can actually point to.
          </h2>
          <p className="mb-[26px] max-w-[460px] text-lg leading-[1.6] text-slate-700">
            Finish the course, pass the test Learnable writes from your curriculum, and earn a
            certificate that's more than a badge.
          </p>
          <div className="flex flex-col gap-3.5">
            {proofPoints.map((point) => (
              <div key={point} className="flex items-center gap-3">
                <Check size={20} strokeWidth={2.2} className="flex-none text-blue" />
                <span className="text-base text-slate-900">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
