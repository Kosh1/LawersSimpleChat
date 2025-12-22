/** @type {import('next').NextConfig} */
// Определяем платформу сборки
const isCloudflare = process.env.CF_PAGES === '1' || process.env.CF_PAGES_BRANCH || process.env.CI && process.env.CF_PAGES;

const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Оптимизация для статических ресурсов
  // compress может не поддерживаться на Cloudflare Pages
  ...(isCloudflare ? {} : { compress: true }),
  
  // Опциональная поддержка прокси для статических ресурсов
  // Если указан NEXT_PUBLIC_PROXY_URL, используем его как assetPrefix
  // Это позволяет загружать статические ресурсы через прокси-сервер
  ...(process.env.NEXT_PUBLIC_PROXY_URL && {
    assetPrefix: process.env.NEXT_PUBLIC_PROXY_URL.replace(/\/$/, ''),
  }),
  
  // Заголовки для статических ресурсов
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
