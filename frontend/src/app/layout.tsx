import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WalkScore – Find Your Ideal Home",
  description:
    "Choose a home location based on walking exercise potential and lifestyle amenities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
