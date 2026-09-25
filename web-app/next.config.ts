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
    minimumCacheTTL: 60 * 60 * 24 * 30,
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
  async headers() {
    return [
      {
        // Photos in /public: kept by the browser for a day, and quietly refreshed for a week after that.
        source: '/:all*(jpg|jpeg|png|webp|avif|gif|svg|ico)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }],
      },
    ];
  },
};

export default nextConfig;
