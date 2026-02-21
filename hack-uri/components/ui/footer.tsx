import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const mainLinks = [
  { label: "Home", href: "#" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Platform", href: "#technology" },
  { label: "Careers", href: "#" },
  { label: "Newsroom", href: "#newsroom" },
]

const supportLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "License", href: "#" },
]

const socialLinks = [
  { label: "LinkedIn", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Facebook", href: "#" },
]

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Top Section */}
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* Logo & CTA */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent-foreground">
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 5h8v3h-8v-3z" fill="currentColor"/>
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">Fleet</span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {"Let's get started on your logistics journey. Request a quote today and discover how Fleet can transform your supply chain."}
            </p>

            <Link
              href="#contact"
              className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-all hover:brightness-110"
            >
              Request a Quote
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-3 gap-8">
            {/* Main */}
            <div>
              <h4 className="mb-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Main
              </h4>
              <ul className="flex flex-col gap-2.5">
                {mainLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="mb-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Support
              </h4>
              <ul className="flex flex-col gap-2.5">
                {supportLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="mb-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Quick Contact
              </h4>
              <ul className="flex flex-col gap-2.5">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            {"© 2025 Fleet. All rights reserved."}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>123 Main St, San Francisco, CA 94105</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
