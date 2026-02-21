import { Navigation } from "@/components/ui/navigation"
import { Hero } from "@/components/ui/hero"
import { Services } from "@/components/ui/services"
import { Features } from "@/components/ui/features"
import { Technology } from "@/components/ui/technology"
import { HowWeWork } from "@/components/ui/how-we-work"
import { Newsroom } from "@/components/ui/newsroom"
import { CTA } from "@/components/ui/cta"
import { Footer } from "@/components/ui/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />
      <Hero />
      <Services />
      <Features />
      <Technology />
      <HowWeWork />
      <Newsroom />
      <CTA />
      <Footer />
    </main>
  )
}
