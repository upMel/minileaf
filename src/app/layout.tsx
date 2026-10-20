import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

import { LanguageProvider, DEFAULT_LOCALE } from "@/context/LanguageContext";
import "./globals.css";

// Admin UI fonts. Geist has no Greek glyphs, so Inter / JetBrains Mono, which do.
const appSans = Inter({
  variable: "--font-app-sans",
  subsets: ["latin", "greek"],
});

const appMono = JetBrains_Mono({
  variable: "--font-app-mono",
  subsets: ["latin", "greek"],
});

// Kaimakidis brand display face (storefront headings).
const brand = localFont({
  src: "./fonts/kaimakidis-brand.woff",
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mini Market Καιμακίδης",
    template: "%s | Καιμακίδης",
  },
  description: "Mini Market Καιμακίδης — στη γειτονιά σου, από το 1965. Προσφορές της εβδομάδας, φυλλάδιο και όλα τα προϊόντα μας.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f5eb",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      suppressHydrationWarning
      className={`${appSans.variable} ${appMono.variable} ${brand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Restore the language before first paint to avoid a flash of the wrong <html lang> */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem('locale');if(l==='el'||l==='en')document.documentElement.lang=l;}catch(e){}`,
          }}
        />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
