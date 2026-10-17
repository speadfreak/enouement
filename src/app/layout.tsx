import type { Metadata, Viewport } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { CustomCursor } from "@/components/custom-cursor";
import { ScrollProgress } from "@/components/scroll-progress";
import { BackToTop } from "@/components/back-to-top";
import { GrainOverlay } from "@/components/grain-overlay";
import { getSite } from "@/lib/data";

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

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://enouement2k27.et";

  // Admin can override favicon/faviconUrl; otherwise use the generated brand icons
  const faviconUrl = site?.faviconUrl;

  const icons = faviconUrl
    ? {
        icon: [{ url: faviconUrl, type: "image/png" as const }],
        shortcut: [faviconUrl],
        apple: [{ url: faviconUrl }],
      }
    : {
        icon: [
          { url: "/favicon.png", type: "image/png", sizes: "32x32" },
          { url: "/icon-16.png", type: "image/png", sizes: "16x16" },
          { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
          { url: "/icon-48.png", type: "image/png", sizes: "48x48" },
        ],
        shortcut: ["/favicon.png"],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
      };

  const ogImage = site?.ogImageUrl || "/og-image.png";
  const siteName = site?.siteName || "Enouement 2K27";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${siteName} — The Final Chapter`,
      template: `%s · ${siteName}`,
    },
    description:
      site?.description ||
      "A cinematic memory of the senior batch, Class of 2027, Ethiopia.",
    keywords: [
      "Enouement",
      "2K27",
      "Class of 2027",
      "Ethiopia",
      "Senior Batch",
      "Yearbook",
      "Graduation",
    ],
    authors: [{ name: site?.devName || "Joseph James" }],
    manifest: "/manifest.json",
    icons,
    openGraph: {
      title: `${siteName} — The Final Chapter`,
      description:
        site?.description ||
        "A cinematic memory of the senior batch, Class of 2027, Ethiopia.",
      url: baseUrl,
      siteName,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description:
        site?.description ||
        "A cinematic memory of the senior batch, Class of 2027, Ethiopia.",
      images: [ogImage],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050a07" },
    { media: "(prefers-color-scheme: light)", color: "#fbfff4" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSite();
  const faviconUrl = site?.faviconUrl;

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${syne.variable}`}>
      <head>
        {faviconUrl ? (
          <link rel="icon" href={faviconUrl} type="image/png" />
        ) : null}
      </head>
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
