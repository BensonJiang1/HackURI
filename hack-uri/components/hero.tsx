import Image from "next/image"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-4 pt-28 pb-16 md:px-6 md:pt-36 md:pb-24">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/public/videos/walking_together.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Label */}
        <div className="mb-8">
          <span className="inline-block rounded-full border border-border px-4 py-1.5 text-xs tracking-widest text-muted-foreground uppercase">
            Home
          </span>
        </div>

        {/* Main Heading */}
        <div className="max-w-4xl">
          <h1 className="text-balance font-serif text-5xl leading-tight tracking-tight text-foreground md:text-7xl lg:text-8xl">
            Make A Plan for a Healthier Lifestyle.
          </h1>
        </div>

        {/* Subtitle row */}
        <div className="mt-10 flex flex-col items-start gap-8 md:mt-16 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3">
            <ArrowDownRight className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              An analytics tool to maximise the most out of your life via deliberate lifestyle preferences
            </p>
          </div>

          <Link
            href="#contact"
            className="group flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground transition-all hover:brightness-110"
          >
            Go to Predictor
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Hero Image Card */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-border md:mt-20">
          <div className="relative aspect-[16/7]">
            <Image
              src="/images/hero-logistics.jpg"
              alt="Fleet logistics operations at a major shipping port"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
