import { LogoMark, Wordmark } from './Brand.jsx'

const columns = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#product' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Verify a credential', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Privacy', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white px-5 py-12 sm:px-7">
      <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-8 sm:flex-row sm:flex-wrap">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <LogoMark size={26} />
            <Wordmark className="text-[19px]" />
          </div>
          <p className="font-mono text-xs tracking-[0.06em] text-slate-400">Learn it. Prove it.</p>
        </div>

        <div className="flex flex-wrap gap-x-14 gap-y-9 sm:gap-14">
          {columns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-2.5">
              <div className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
                {col.heading}
              </div>
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-slate-700 transition-colors hover:text-ink-navy"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-9 max-w-[1120px] border-t border-line pt-5 text-[13px] text-slate-400">
        © 2026 Learnable. All rights reserved.
      </div>
    </footer>
  )
}
