import type { Metadata } from "next";
import "./globals.css";

const description = "Seven digital works where living forms meet machine processes.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "AUREL — Synthetic Nature",
  description,
  icons: { icon: { url: "/assets/brand/favicon.svg", type: "image/svg+xml" }, apple: "/assets/brand/favicon-512.png" },
  openGraph: { title: "AUREL — Synthetic Nature", description, images: ["/assets/brand/og-image.jpg"] },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
