# Learnable — marketing website

Production implementation of the **Learnable** marketing homepage (design option `1c`,
product-led) exported from Claude Design. This is a real, mobile-friendly build of the design
reference in `../project/Learnable Website.dc.html`, recreated idiomatically rather than porting
the prototype's streaming-component runtime.

**Learn it. Prove it.** — a focused-learning credentialing platform: locked, AI-tutored study
sessions that end in a verifiable credential.

## Stack

- **React 18** + **Vite 6**
- **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.js`)
- **lucide-react** for icons (matches the design system's Lucide substitution)
- Google Fonts: Plus Jakarta Sans (display), Inter (body/UI), Roboto Mono (labels)

The Learnable design tokens (colors, type families, radii, shadows, the two hero keyframes)
are mapped into the Tailwind theme in [`src/index.css`](src/index.css), so components style
against real tokens (`bg-ink-navy`, `text-gold`, `rounded-btn`, `shadow-mock`, `animate-blink`…)
rather than hard-coded values.

## Getting started

```bash
npm install
npm run dev      # local dev server (default http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Structure

```
src/
  App.jsx                  # page composition
  index.css                # Tailwind + Learnable design tokens (@theme) + keyframes
  data/curricula.js        # the four static demo curricula (Python/Spanish/Guitar/Speaking)
  components/
    Brand.jsx              # inline logo mark, wordmark, gold seal SVGs
    Nav.jsx                # sticky nav + mobile hamburger menu
    Hero.jsx               # split hero + animated "locked session" mock
    Features.jsx           # "What's inside" 4-card grid
    CurriculumDemo.jsx     # interactive subject → curriculum switcher (the one stateful piece)
    FocusBand.jsx          # navy "locked in, on purpose" band
    Credential.jsx         # certificate object + proof points
    Pricing.jsx            # trial / $25 first month / $15 ongoing
    ClosingCTA.jsx         # closing call-to-action (navy | blue variant)
    Footer.jsx
```

## Mobile-friendly behavior

Built responsive from the ground up (mobile-first Tailwind breakpoints), not patched after the
fact:

- **Nav** collapses to a logo + `Start free` + hamburger button that opens a real dropdown menu
  (below `md`). The desktop text links show at `md` and up.
- **Hero** stacks copy above the session mock at `<lg`; the h1 scales 56 → 38 → 32px.
- **Feature grid** flows 4 → 2 → 1 columns (`lg` → `sm` → base).
- **Curriculum demo**, **focus band**, **credential**, and **pricing** all collapse to a single
  column below their `lg`/`sm` breakpoints; the certificate leads on mobile.
- Section padding, CTA padding, and headings scale down on small screens.
- Decorative hero animations (typing cursor, pulsing lock dot) respect
  `prefers-reduced-motion`.

## The one interaction

Clicking a subject chip in the curriculum demo (Python / Spanish / Guitar / Public speaking)
updates the active-subject heading, chip highlight, one-line goal, all five module titles, and
the capstone — purely client-side React state. Default subject is the `defaultSubject` prop on
`<CurriculumDemo />` in `App.jsx`. The closing CTA accepts a `variant="navy" | "blue"` prop.

See [`../project/design_handoff_learnable_website/README.md`](../project/design_handoff_learnable_website/README.md)
for the full section-by-section design spec and token reference.
