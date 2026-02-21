import Image from "next/image"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-transparent px-4 pt-28 pb-16 md:px-6 md:pt-36 md:pb-24">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/videos/walking_together.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Label */}
        {/* <div className="mb-8">
          <span className="inline-block rounded-full border border-border px-4 py-1.5 text-xs tracking-widest text-muted-foreground uppercase">
            Home
          </span>
        </div> */}

        {/* Main Heading */}
        <div className="max-w-4xl">
          {/* Add w-fit here to make the container hug its content */}
          <h1 className="w-fit font-serif text-5xl leading-tight tracking-tight text-[#fffcd4] md:text-7xl lg:text-8xl backdrop-blur-md bg-white/10 px-4 py-2 rounded-2xl">
            Make A Plan for a <span className="text-[#EFB500]">Healthier</span> Lifestyle.
          </h1>
        </div>

        {/* Subtitle row */}
        <div className="mt-10 flex flex-col items-start gap-8 md:mt-16 md:flex-row md:items-end md:justify-between">
          
          <div className="flex items-start gap-3 backdrop-blur-md bg-white/10 px-5 py-4 rounded-2xl">
            <ArrowDownRight className="mt-1 h-5 w-5 flex-shrink-0 text-[#EFB500]" />
            <p className="max-w-md text-base leading-relaxed text-[#fffcd4]/90 md:text-lg">
              An analytics tool to maximise the most out of your life via deliberate lifestyle preferences
            </p>
          </div>

          <Link
            href="/main-page"
            className="group flex items-center gap-2 rounded-xl backdrop-blur-md bg-white/10 px-7 py-3.5 text-sm font-medium text-[#fffcd4] transition-all hover:bg-white/20 border border-white/10"
          >
            Go to Predictor
            <ArrowUpRight className="h-4 w-4 text-[#EFB500] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Hero Image Card */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-border md:mt-20">
          
        </div>
      </div>
    </section>
  )
}

