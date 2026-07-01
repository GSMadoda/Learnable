// The static curricula behind the interactive demo.
// Labels and modules are intentionally specific — each is "learn X for Y".
export const curricula = {
  python: {
    label: 'Python for building an LLM',
    goal: 'Train and ship a working language model',
    modules: [
      'Python foundations for ML work',
      'Tensors, autograd & PyTorch basics',
      'Tokenization & the transformer block',
      'Training loops, data & compute',
      'Fine-tuning, evaluation & inference',
    ],
    capstone: 'Train a small transformer and generate text from your own data',
  },
  spanish: {
    label: 'Spanish for travel to Spain',
    goal: 'Get around Spain with confidence',
    modules: [
      'Sounds, greetings & polite basics',
      'Ordering food, tapas & drinks',
      'Directions, transport & tickets',
      'Hotels, shopping & handling money',
      'Small talk & sorting out problems',
    ],
    capstone: 'Plan and role-play a week-long trip entirely in Spanish',
  },
  guitar: {
    label: 'Guitar for worship in church',
    goal: 'Lead a worship set with confidence',
    modules: [
      'Tuning, posture & open chords',
      'Strumming patterns for worship songs',
      'Capo, keys & singer-friendly transposing',
      'Four-chord progressions & dynamics',
      'Leading a band & following the singer',
    ],
    capstone: 'Lead a full worship song for your congregation',
  },
  speaking: {
    label: 'Public speaking for keynote talks',
    goal: 'Deliver a keynote that lands',
    modules: [
      'Shaping one clear big idea',
      'Openings that earn the room',
      'Story, structure & the through-line',
      'Voice, pace, pauses & presence',
      'Slides, staging & handling Q&A',
    ],
    capstone: 'Deliver a 15-minute keynote to a live audience',
  },
  property: {
    label: 'Property development',
    goal: 'Take a site from purchase to profit',
    modules: [
      'Sourcing sites & spotting potential',
      'The numbers: appraisals, GDV & margin',
      'Financing, funding & the deal stack',
      'Planning permission & design basics',
      'Managing the build & selling on',
    ],
    capstone: 'Build a full development appraisal for a real site',
  },
  insurance: {
    label: 'Building a digital insurance startup',
    goal: 'Launch an insurtech product',
    modules: [
      'How insurance actually makes money',
      'Regulation, licensing & capacity',
      'Pricing, risk & underwriting basics',
      'Product, claims & the customer journey',
      'Distribution, growth & unit economics',
    ],
    capstone: 'Pitch a full insurtech business plan to investors',
  },
  podcast: {
    label: 'Starting a podcast',
    goal: 'Launch and grow a show people finish',
    modules: [
      'Finding your show & its audience',
      'Gear, recording & clean audio',
      'Formats, booking & interviewing',
      'Editing, show notes & publishing',
      'Growth, promotion & sponsorship',
    ],
    capstone: 'Record, edit & publish your first three episodes',
  },
}

// Stable render order for the subject chips.
export const subjectOrder = [
  'python',
  'spanish',
  'guitar',
  'speaking',
  'property',
  'insurance',
  'podcast',
]
