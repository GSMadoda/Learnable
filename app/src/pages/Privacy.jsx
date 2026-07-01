import PageShell from '../components/PageShell.jsx'

// Plain-language summary of the data the app actually handles (per server.js).
// Review with your own counsel before launch — this is a starting point, not legal advice.
export default function Privacy() {
  const sections = [
    {
      h: 'What we collect',
      p: 'When you create an account we store your name and email and a securely hashed password. If you sign in with Google, we receive your basic Google profile (name, email). You can add optional profile details — a photo, headline, education, and LinkedIn URL. As you learn, we record your programs, lesson progress, quiz results, and study time.',
    },
    {
      h: 'Payments',
      p: 'Enrollment payments are processed by our payment provider, Dodo Payments. We do not store your card details; we keep a reference to each payment so we can unlock the program you bought.',
    },
    {
      h: 'How we use your data',
      p: 'We use your information to provide the service: to build and tutor your curriculum, track your progress, issue and verify your credentials, and — only if you opt in — list you in the alumni directory. Curriculum, lessons, and tutoring are generated using a third-party AI provider.',
    },
    {
      h: 'The alumni directory',
      p: 'The directory only ever shows members who have earned a credential and have left “show me in the alumni directory” switched on. You can turn this off at any time from your profile.',
    },
    {
      h: 'Email',
      p: 'We send transactional email only — sign-in links and password resets. We do not sell your data or send marketing without your consent.',
    },
    {
      h: 'Your choices',
      p: 'You can edit or remove your profile details at any time, and hide yourself from the alumni directory. To delete your account or request a copy of your data, email us.',
    },
  ]

  return (
    <PageShell
      title="Privacy"
      lead="A plain-language summary of what Learnable collects and why. We keep it to what the product actually needs."
    >
      <div className="flex flex-col gap-6">
        {sections.map((s) => (
          <div key={s.h}>
            <h2 className="mb-2 font-display text-xl font-extrabold tracking-[-0.01em] text-ink-navy">
              {s.h}
            </h2>
            <p className="leading-[1.7] text-slate-700">{s.p}</p>
          </div>
        ))}
        <p className="text-slate-500">
          Questions about your data? Email{' '}
          <a href="mailto:support@getlearnable.org" className="font-semibold text-blue">
            support@getlearnable.org
          </a>
          .
        </p>
      </div>
    </PageShell>
  )
}
