import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const baseConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  serverExternalPackages: ["dotenv", "@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.neon.tech" },
      { protocol: "https", hostname: "z-cdn.chatglm.cn" },
    ],
  },
  experimental: {
    // Tree-shake & per-module ESM imports for these heavy libs so the
    // initial bundle only ships the icons/components actually used.
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "recharts",
      // Radix UI primitives — many shadcn/ui components import these.
      // Listing them here lets Next split per-primitive imports.
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-context-menu",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-tooltip",
    ],
  },
};

const shouldAnalyze = process.env.ANALYZE === "true";

const withBundleAnalyzer = bundleAnalyzer({ enabled: true });

export default shouldAnalyze
  ? withBundleAnalyzer(baseConfig)
  : baseConfig;
