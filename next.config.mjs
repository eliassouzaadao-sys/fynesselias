/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Manter por enquanto - requer configuração de loader para otimizar
  },
  devIndicators: false,

  // Performance: Compilação otimizada
  reactStrictMode: true,

  // Performance: Otimizações experimentais
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },

  // Performance: Headers de cache para assets estáticos
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
