import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
