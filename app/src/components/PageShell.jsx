import { Link } from 'react-router-dom'
import { LogoMark, Wordmark } from './Brand.jsx'
import Footer from './Footer.jsx'

// Lightweight header/footer wrapper for standalone static pages
// (About, Privacy, Verify) so they match the marketing site.
export default function PageShell({ title, lead, children }) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1120px] items-center px-5 py-3.5 sm:px-7">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Learnable home">
            <LogoMark size={28} />
            <Wordmark className="text-lg" />
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-[760px] px-5 py-12 sm:px-7 lg:py-16">
        {title && (
          <h1 className="mb-3 font-display text-[30px] font-extrabold tracking-[-0.02em] text-ink-navy sm:text-[40px]">
            {title}
          </h1>
        )}
        {lead && <p className="mb-8 text-lg leading-[1.6] text-slate-700">{lead}</p>}
        {children}
      </main>

      <Footer />
    </div>
  )
}
