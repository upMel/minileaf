import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { LanguageProvider, DEFAULT_LOCALE } from "@/context/LanguageContext";
import "./globals.css";

// Geist ships only latin/latin-ext/cyrillic — it has no Greek glyphs, so Greek
// copy silently fell back to a system font. Inter covers Greek and is the
// closest match; JetBrains Mono is the mono counterpart that also covers Greek.
const appSans = Inter({
  variable: "--font-app-sans",
  subsets: ["latin", "greek"],
});

const appMono = JetBrains_Mono({
  variable: "--font-app-mono",
  subsets: ["latin", "greek"],
});

export const metadata: Metadata = {
  title: "MiniLeaf",
  description: "Φυλλάδιο προσφορών για το μίνι μάρκετ σας",
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
  themeColor: "#ffffff",
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
      className={`${appSans.variable} ${appMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Restore palette and language before first paint to avoid a flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=localStorage.getItem('palette');if(p)document.documentElement.dataset.palette=p;var l=localStorage.getItem('locale');if(l==='el'||l==='en')document.documentElement.lang=l;}catch(e){}`,
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
