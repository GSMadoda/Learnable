import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { LogoMark, Wordmark } from './Brand.jsx'

const links = [
  { href: '#product', label: 'Product' },
  { href: '#build', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-white/[0.82] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-3.5 sm:px-7">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Learnable home">
          <LogoMark size={30} />
          <Wordmark className="text-xl" />
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[15px] font-medium text-slate-700 transition-colors hover:text-ink-navy"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#start"
            className="rounded-btn bg-blue px-[18px] py-[9px] text-[14.5px] font-semibold text-white transition-colors hover:bg-blue-hover active:bg-blue-press"
          >
            Start free
          </a>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 md:hidden">
          <a
            href="#start"
            className="rounded-btn bg-blue px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-blue-hover active:bg-blue-press"
          >
            Start free
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-control text-ink-navy transition-colors hover:bg-blue-50"
          >
            {open ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {open && (
        <div className="border-t border-line bg-white md:hidden">
          <div className="mx-auto flex max-w-[1120px] flex-col px-5 py-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3.5 text-[15px] font-medium text-slate-700 last:border-b-0 hover:text-ink-navy"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
