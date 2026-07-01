import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'

export default function About() {
  return (
    <PageShell
      title="About Learnable"
      lead="Learn it. Prove it. — a focused-learning platform that turns any goal into a real, credentialed skill."
    >
      <div className="flex flex-col gap-6 leading-[1.7] text-slate-700">
        <p>
          Most online learning is easy to start and easy to abandon. Learnable is built around the
          opposite idea: you commit to a session, and you stay in it until the timer ends. Learnable
          designs a curriculum for whatever you want to master, tutors you in real time, and tests
          you — and when you finish, you earn a credential you can actually point to.
        </p>

        <div>
          <h2 className="mb-3 font-display text-xl font-extrabold tracking-[-0.01em] text-ink-navy">
            How it works
          </h2>
          <ol className="ml-5 list-decimal space-y-2">
            <li>Name a subject and your reason. Learnable builds a five-module path with a capstone.</li>
            <li>Enroll to unlock focused, AI-tutored study sessions.</li>
            <li>Work through the lessons and pass the test written from your own curriculum.</li>
            <li>Finish the capstone and earn a verifiable credential — a unique ID and a public page.</li>
          </ol>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-extrabold tracking-[-0.01em] text-ink-navy">
            Why credentials
          </h2>
          <p>
            A Learnable credential is more than a badge. Every one has a unique ID and a public
            verification page anyone can check, so the work behind it is easy to trust — and yours to
            keep, forever.
          </p>
        </div>

        <p className="text-slate-500">
          Questions? Email{' '}
          <a href="mailto:support@getlearnable.org" className="font-semibold text-blue">
            support@getlearnable.org
          </a>{' '}
          or{' '}
          <Link to="/" className="font-semibold text-blue">
            start building a plan
          </Link>
          .
        </p>
      </div>
    </PageShell>
  )
}
