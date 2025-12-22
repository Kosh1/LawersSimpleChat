/** @type {import('next').NextConfig} */
// Конфигурация для Cloudflare Pages
// compress не поддерживается на Cloudflare Pages, поэтому не включаем его
const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  
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
