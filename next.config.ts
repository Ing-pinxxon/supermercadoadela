import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las fotos de los productos viven en Vercel Blob.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
