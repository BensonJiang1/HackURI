"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useState } from "react"

const steps = [
  {
    number: "01",
    title: "Plan",
    description:
      "Define shipment details, choose transport modes, and handle necessary documentation.",
    image: "/images/freight.jpg",
  },
  {
    number: "02",
    title: "Execute",
    description:
      "Coordinate pickup, manage warehousing, and ensure smooth transit across all touchpoints.",
    image: "/images/how-we-work.jpg",
  },
  {
    number: "03",
    title: "Deliver",
    description:
      "Complete last-mile delivery, provide real-time tracking, and confirm successful handoff.",
    image: "/images/supply-chain.jpg",
  },
]

export function HowWeWork() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section className="px-4 py-20 md:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        {/* Label */}
        <span className="mb-6 inline-block text-xs tracking-widest text-muted-foreground uppercase">
          How We Work
        </span>

        {/* Section Heading */}
        <h2 className="max-w-5xl text-pretty font-serif text-3xl leading-snug tracking-tight text-foreground md:text-4xl lg:text-5xl">
          Fleet puts shippers and carriers first, delivering smart, transparent
          logistics that boost efficiency, cut costs, and drive growth.
        </h2>

        {/* Steps + Image Grid */}
        <div className="mt-16 grid gap-8 md:mt-20 md:grid-cols-2 md:gap-12">
          {/* Steps List */}
          <div className="flex flex-col gap-2">
            {steps.map((step, index) => (
              <button
                key={step.number}
                onClick={() => setActiveStep(index)}
                className={`group flex items-start gap-6 rounded-2xl border p-6 text-left transition-all ${
                  activeStep === index
                    ? "border-accent/30 bg-secondary"
                    : "border-transparent hover:border-border hover:bg-secondary/50"
                }`}
              >
                <span
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                    activeStep === index
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step.number}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </button>
            ))}

            <div className="mt-4">
              <Link
                href="#services"
                className="group flex w-fit items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-muted-foreground/50"
              >
                View All
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
              <Image
                src={steps[activeStep].image}
                alt={steps[activeStep].title}
                fill
                className="object-cover transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
