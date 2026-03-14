import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      const currentIgnored = config.watchOptions?.ignored;
      const ignoredList = Array.isArray(currentIgnored)
        ? currentIgnored
        : currentIgnored
          ? [currentIgnored]
          : [];

      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          ...ignoredList,
          "**/supabase-functions-backup/**",
          "**/tenant-template/**",
          "**/_vercel_exclude/**",
        ],
      };
    }

    return config;
  },
};

export default nextConfig;
