import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export function CTA() {
  return (
    <section id="contact" className="px-4 py-20 md:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-border">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/images/cta-bg.jpg"
              alt="Container ship crossing the ocean"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-background/80" />
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center px-8 py-20 text-center md:py-32">
            <span className="mb-4 text-xs tracking-widest text-muted-foreground uppercase">
              {"Let's Connect"}
            </span>
            <h2 className="max-w-2xl text-balance font-serif text-4xl tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Moving Your Business Forward
            </h2>

            {/* Decorative logos row */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 opacity-40">
              {["DHL", "FedEx", "UPS", "Maersk", "CMA CGM"].map((name) => (
                <span
                  key={name}
                  className="text-sm font-medium tracking-wider text-foreground uppercase"
                >
                  {name}
                </span>
              ))}
            </div>

            <Link
              href="#"
              className="group mt-12 flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-sm font-medium text-accent-foreground transition-all hover:brightness-110"
            >
              Contact Us
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

