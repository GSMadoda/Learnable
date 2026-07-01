import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { api } from '../api.js'
import { Spinner } from '../ui.jsx'
import { LogoMark, Wordmark, GoldSeal } from '../components/Brand.jsx'

// Public credential verification page (no auth). Mirrors GET /api/verify/:credId.
export default function Verify() {
  const { credId } = useParams()
  const [result, setResult] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await api.verifyCred(credId)
        if (alive) setResult(res)
      } catch {
        if (alive) setResult({ valid: false })
      }
    })()
    return () => {
      alive = false
    }
  }, [credId])

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

      <div className="mx-auto max-w-[560px] px-5 py-12 sm:px-7">
        {result === null ? (
          <Spinner label="Verifying credential…" />
        ) : result.valid ? (
          <div className="overflow-hidden rounded-panel border border-line bg-white shadow-cert">
            <div className="h-1.5 bg-[linear-gradient(90deg,var(--color-blue),var(--color-sky))]" />
            <div className="px-6 py-8 text-center sm:px-[34px] sm:py-[34px]">
              <GoldSeal size={56} className="mx-auto mb-[18px] block" />
              <div className="mb-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-blue">
                <CheckCircle2 size={14} /> Verified credential
              </div>
              <div className="mb-1.5 text-[13px] text-slate-500">This certifies that</div>
              <div className="mb-1.5 font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink-navy">
                {result.name}
              </div>
              <div className="mb-6 text-sm text-slate-700">
                has mastered <strong className="text-ink-navy">{result.programTitle}</strong>
              </div>

              {result.skills?.length > 0 && (
                <div className="mb-6 flex flex-wrap justify-center gap-2">
                  {result.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-line bg-slate-50 px-2.5 py-1 text-[12.5px] text-slate-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-center gap-10 border-t border-line pt-[18px]">
                <div>
                  <div className="mb-[5px] font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">
                    Credential ID
                  </div>
                  <div className="font-mono text-[13px] font-medium text-gold-text">{credId}</div>
                </div>
                <div>
                  <div className="mb-[5px] font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">
                    Issued
                  </div>
                  <div className="font-mono text-[13px] font-medium text-blue">
                    {result.issuedAt ? new Date(result.issuedAt).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-panel border border-line bg-white p-10 text-center shadow-card">
            <XCircle size={40} className="mx-auto mb-4 text-slate-300" />
            <h1 className="mb-2 font-display text-xl font-extrabold text-ink-navy">
              Credential not found
            </h1>
            <p className="text-slate-500">
              No valid credential matches <span className="font-mono">{credId}</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
