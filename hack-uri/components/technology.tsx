import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export function Technology() {
  return (
    <section id="technology" className="px-4 py-20 md:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        {/* Label */}
        <span className="mb-6 inline-block text-xs tracking-widest text-muted-foreground uppercase">
          Our Technology
        </span>

        {/* Heading area with mixed styles */}
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-pretty text-4xl leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              <span className="font-serif">Our AI-Driven</span>
              <br />
              <span className="relative inline-block">
                <Image
                  src="/images/technology.jpg"
                  alt="AI technology"
                  width={180}
                  height={60}
                  className="inline-block h-10 w-32 rounded-lg object-cover align-middle md:h-14 md:w-44"
                />
              </span>{" "}
              <span className="font-sans font-light text-muted-foreground">logistics fuels</span>
              <br />
              <span className="font-sans font-light text-muted-foreground">agile global supply chains.</span>
            </h2>
          </div>

          <Link
            href="#contact"
            className="group flex h-fit items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-muted-foreground/50"
          >
            Explore Platform
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Large image */}
        <div className="mt-16 overflow-hidden rounded-2xl border border-border md:mt-20">
          <div className="relative aspect-[16/7]">
            <Image
              src="/images/technology.jpg"
              alt="Fleet AI-driven logistics platform dashboard"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
