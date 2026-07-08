import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { About } from './sections/About'
import { Products } from './sections/Products'
import { Services } from './sections/Services'
import { Process } from './sections/Process'
import { WhyUs } from './sections/WhyUs'
import { Projects } from './sections/Projects'
import { Contact } from './sections/Contact'
import { Footer } from './sections/Footer'

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Products />
        <Services />
        <Process />
        <WhyUs />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
