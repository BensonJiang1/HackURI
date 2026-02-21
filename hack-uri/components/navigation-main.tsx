"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ArrowUpRight, MapPin, Sparkles } from "lucide-react"

// Define the props interface
interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function NavigationMain({ activeTab, onTabChange }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { id: "address", label: "Location", icon: MapPin },
    { id: "amenities", label: "Amenities", icon: Sparkles },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4 md:mx-6 md:mt-6">
        <nav className="flex items-center justify-between rounded-2xl border border-[#ffb614] bg-[#FDFCF0] px-5 py-3 backdrop-blur-xl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffb614]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-black">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 5h8v3h-8v-3z" fill="currentColor" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-black">Amenity Aware</span>
          </Link>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/"
              className="group flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:brightness-110"
            >
              Go Home
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-black md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="mt-2 rounded-2xl border border-[#ffb614]/15 bg-[#FDFCF0] p-4 shadow-xl md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                    activeTab === item.id ? "bg-[#ffb614] text-black" : "bg-black/5 text-black"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}