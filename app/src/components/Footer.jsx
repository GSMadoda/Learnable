import { Link } from 'react-router-dom'
import { LogoMark, Wordmark } from './Brand.jsx'

// `kind`: 'route' → internal Link, 'anchor' → same/other-page hash, 'external' → mailto/href.
const columns = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', to: '/#product', kind: 'anchor' },
      { label: 'Pricing', to: '/#pricing', kind: 'anchor' },
      { label: 'Verify a credential', to: '/verify', kind: 'route' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', to: '/about', kind: 'route' },
      { label: 'Contact', to: 'mailto:support@getlearnable.org', kind: 'external' },
      { label: 'Privacy', to: '/privacy', kind: 'route' },
    ],
  },
]

function FooterLink({ link }) {
  const cls = 'text-sm text-slate-700 transition-colors hover:text-ink-navy'
  if (link.kind === 'route') {
    return (
      <Link to={link.to} className={cls}>
        {link.label}
      </Link>
    )
  }
  return (
    <a href={link.to} className={cls}>
      {link.label}
    </a>
  )
}

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
                <FooterLink key={link.label} link={link} />
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
