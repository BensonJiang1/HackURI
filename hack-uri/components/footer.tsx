import Link from "next/link"

const socialLinks = [
  { label: "Andrew Li", href: "https://github.com/andrewli888" },
  { label: "Brian Becker", href: "https://github.com/b1becker" },
  { label: "Benson Jiang", href: "https://github.com/BensonJiang1" }
]

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-16 md:px-6 md:py-20 bg-[#FDFCF0]">
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
              <span className="text-lg font-semibold tracking-tight text-black">Amenity Aware</span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {"BBA Industries is a technology company that provides a platform for building and deploying AI agents. Our mission is to empower businesses to leverage the power of AI to solve complex problems and drive innovation."}
            </p>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-3 gap-8">
            
          

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
                      className="text-sm text-black transition-colors hover:text-foreground"
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
            {"© 2026 Amenity Aware. All rights reserved."}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>177 College Ave, Medford, MA 02155</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
