import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Features from './components/Features.jsx'
import CurriculumDemo from './components/CurriculumDemo.jsx'
import FocusBand from './components/FocusBand.jsx'
import Credential from './components/Credential.jsx'
import Pricing from './components/Pricing.jsx'
import ClosingCTA from './components/ClosingCTA.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <div className="overflow-x-hidden bg-paper">
      <Nav />
      <main>
        <Hero />
        <Features />
        <CurriculumDemo defaultSubject="python" />
        <FocusBand />
        <Credential />
        <Pricing />
        <ClosingCTA variant="navy" />
      </main>
      <Footer />
    </div>
  )
}
