import type { NextConfig } from "next";

// next/image only loads remote photos from hosts listed here. Take the Supabase host from the
// same env var the app already uses, so it can never drift from the real project again
// (it once pointed at an old project and every admin-uploaded photo showed as a broken image).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const hosts = Array.from(new Set([
  ...(supabaseHost ? [supabaseHost] : []),
  'ghmzsxaesegxmtxzdrlx.supabase.co',
  'heumjowshymszctoetlx.supabase.co', // earlier project; images uploaded there may still be referenced
]));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...hosts.map(hostname => ({
        protocol: 'https' as const,
        hostname,
        pathname: '/storage/v1/object/public/**',
      })),
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
