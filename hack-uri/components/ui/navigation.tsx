"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ArrowUpRight } from "lucide-react"

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Platform", href: "#technology" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Newsroom", href: "#newsroom" },
]

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4 md:mx-6 md:mt-6">
        <nav className="flex items-center justify-between rounded-2xl border border-[#ffb614]/15 bg-[#0f0e0b]/90 px-5 py-3 backdrop-blur-xl">
          {/* Logo */}
          <Link href="#" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent-foreground">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 5h8v3h-8v-3z" fill="currentColor" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">Fleet</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-[#ffb614]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="#contact"
              className="group flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:brightness-110"
            >
              Request a Quote
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="mt-2 rounded-2xl border border-[#ffb614]/15 bg-[#0f0e0b]/95 p-6 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-[#ffb614]/10 hover:text-[#ffb614]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <Link
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-accent-foreground"
              >
                Request a Quote
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
