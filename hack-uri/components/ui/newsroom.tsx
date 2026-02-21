import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const articles = [
  {
    date: "9.08.25",
    title: "Tech Transforms Shipping's Future",
    image: "/images/news-1.jpg",
  },
  {
    date: "8.12.25",
    title: "Logistics Drives Business Growth",
    image: "/images/news-2.jpg",
  },
  {
    date: "8.29.25",
    title: "Sustainable Shipping: Reduce Your Footprint",
    image: "/images/news-3.jpg",
  },
  {
    date: "9.01.25",
    title: "Master Customs Compliance",
    image: "/images/freight.jpg",
  },
  {
    date: "10.02.25",
    title: "E-Commerce Delivery Excellence",
    image: "/images/warehouse.jpg",
  },
  {
    date: "9.27.25",
    title: "Transparency Through Real-Time Tracking",
    image: "/images/technology.jpg",
  },
]

export function Newsroom() {
  return (
    <section id="newsroom" className="px-4 py-20 md:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        {/* Header Row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-4 inline-block text-xs tracking-widest text-muted-foreground uppercase">
              Recent Articles
            </span>
            <h2 className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
              Newsroom
            </h2>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:mt-16">
          {articles.map((article) => (
            <Link
              key={article.title}
              href="#"
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-muted-foreground/30"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex items-start justify-between gap-4 p-5">
                <div>
                  <span className="text-xs text-muted-foreground">
                    {article.date}
                  </span>
                  <h3 className="mt-1.5 text-base font-medium leading-snug text-foreground">
                    {article.title}
                  </h3>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
