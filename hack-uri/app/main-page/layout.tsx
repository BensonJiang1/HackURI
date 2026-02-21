// app/main-page/layout.tsx
export default function MainPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // DO NOT use <html> or <body> here. 
    // Just a fragment or a div.
    <section className="main-page-wrapper">
      {children}
    </section>
  )
}