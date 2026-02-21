import Image from "next/image"

const features = [
  {
    number: "01",
    title: "Freight Forwarding",
    description:
      "Reliable transportation of goods by air, land, or sea. We handle logistics, customs clearance, and delivery.",
    image: "/images/freight.jpg",
  },
  {
    number: "02",
    title: "Innovation",
    description:
      "Our cutting-edge technology and creative problem-solving transform supply chains, shaping the future of global commerce.",
    image: "/images/innovation.jpg",
  },
  {
    number: "03",
    title: "Sustainability",
    description:
      "We're committed to reducing our environmental footprint, promoting eco-friendly practices that contribute to a more responsible logistics industry.",
    image: "/images/sustainability.jpg",
  },
]

export function Features() {
  return (
    <section id="services" className="px-4 py-20 md:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card"
            >
              {/* Number Badge */}
              <div className="flex items-start justify-between p-6 pb-4">
                <span className="text-sm font-medium text-accent">{feature.number}</span>
              </div>

              {/* Title & Description */}
              <div className="px-6 pb-6">
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>

              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
