import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Search } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { Button, Input } from '../ui.jsx'

// Entry point for "Verify a credential": look up an ID, then hand off to
// /verify/:credId (the existing public verification page).
export default function VerifyLanding() {
  const [id, setId] = useState('')
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
    const cred = id.trim()
    if (cred) navigate(`/verify/${encodeURIComponent(cred)}`)
  }

  return (
    <PageShell
      title="Verify a credential"
      lead="Every Learnable credential has a unique ID and a public page anyone can check. Enter an ID to verify it."
    >
      <form onSubmit={onSubmit} className="flex max-w-[520px] flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. LRN-7K2A-9X4D"
            className="pl-10 font-mono uppercase"
            autoCapitalize="characters"
          />
        </div>
        <Button type="submit" size="lg">
          <Search size={16} /> Verify
        </Button>
      </form>
      <p className="mt-3 text-[13.5px] text-slate-400">
        The ID is printed on the certificate, in the format <span className="font-mono">LRN-XXXX-XXXX</span>.
      </p>
    </PageShell>
  )
}
