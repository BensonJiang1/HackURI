import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { Services } from "@/components/services"
import { Features } from "@/components/features"
import { Technology } from "@/components/technology"
import { HowWeWork } from "@/components/how-we-work"
import { Newsroom } from "@/components/newsroom"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      
      {/* <Features /> */}
      
      <Footer />
    </main>
  )
}
