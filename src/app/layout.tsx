import type { Metadata, Viewport } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { CustomCursor } from "@/components/custom-cursor";
import { ScrollProgress } from "@/components/scroll-progress";
import { BackToTop } from "@/components/back-to-top";
import { GrainOverlay } from "@/components/grain-overlay";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://enouement2k27.et"),
  title: {
    default: "Enouement 2K27 — The Final Chapter",
    template: "%s · Enouement 2K27",
  },
  description:
    "A cinematic memory of the senior batch, Class of 2027, Ethiopia. Every moment, every face, every story — preserved forever.",
  keywords: ["Enouement", "2K27", "Class of 2027", "Ethiopia", "Senior Batch", "Yearbook", "Graduation"],
  authors: [{ name: "Enouement 2K27" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Enouement 2K27 — The Final Chapter",
    description: "A cinematic memory of the senior batch, Class of 2027, Ethiopia.",
    type: "website",
    siteName: "Enouement 2K27",
  },
  twitter: {
    card: "summary_large_image",
    title: "Enouement 2K27 — The Final Chapter",
    description: "A cinematic memory of the senior batch, Class of 2027, Ethiopia.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050a07" },
    { media: "(prefers-color-scheme: light)", color: "#fbfff4" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${syne.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground grain">
        <Providers>
          <CustomCursor />
          <ScrollProgress />
          <GrainOverlay />
          {children}
          <BackToTop />
          <Toaster
            position="bottom-right"
            theme="system"
            toastOptions={{
              classNames: {
                toast: "glass-strong !text-foreground !border-border",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
