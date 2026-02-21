import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const services = [
  {
    image: "/images/freight.jpg",
    title: "Freight Forwarding",
    description:
      "Reliable transportation of goods by air, land, or sea. We handle logistics, customs clearance, and delivery.",
  },
  {
    image: "/images/warehouse.jpg",
    title: "Warehousing and Storage",
    description:
      "Secure, climate-controlled storage with flexible options and real-time inventory management.",
  },
  {
    image: "/images/supply-chain.jpg",
    title: "Supply Chain Management",
    description:
      "Customized logistics solutions to optimize your supply chain, reduce costs, and improve efficiency.",
  },
]

export function Services() {
  return (
    <section id="about" className="px-4 py-20 md:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        {/* Section Label */}
        <span className="mb-6 inline-block text-xs tracking-widest text-muted-foreground uppercase">
          What We Do
        </span>

        {/* Section Heading */}
        <h2 className="max-w-5xl text-pretty font-serif text-3xl leading-snug tracking-tight text-foreground md:text-4xl lg:text-5xl">
          We empower businesses to move goods smarter, faster, and more
          sustainably with innovative logistics solutions that drive growth and
          transform global shipping.
        </h2>

        {/* Service Cards */}
        <div className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-muted-foreground/30"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-start">
          <Link
            href="#services"
            className="group flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-muted-foreground/50"
          >
            Learn More
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
