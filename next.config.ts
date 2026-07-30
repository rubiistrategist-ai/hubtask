import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'txkjlxikthwlvjwbcbnz.supabase.co' }, // Substitua pelo URL do SEU projeto Supabase se for diferente
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;