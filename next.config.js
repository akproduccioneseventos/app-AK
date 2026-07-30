const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development' || process.env.AK_DISABLE_PWA_BUILD === 'true',
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Evita que el sitio sea embebido en iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Desactiva detección de MIME-type automática del navegador
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Fuerza HTTPS por 1 año, incluye subdominios
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Controla información de referencia enviada a terceros
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Desactiva features de navegador no necesarias
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Protección XSS básica para navegadores legacy
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: ['framer-motion'],
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Firebase Storage — required for social-wall photos uploaded via Admin SDK.
      // Public URLs are always https://storage.googleapis.com/{bucket}/{path}.
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      (warning) => {
        const message = warning?.message || '';
        const resource = warning?.module?.resource || '';
        return (
          message.includes('Critical dependency') &&
          (resource.includes('@opentelemetry') || resource.includes('require-in-the-middle'))
        );
      },
    ];

    config.resolve.alias = {
      ...config.resolve.alias,
      'canvg': false,
      'dompurify': false,
    };

    return config;
  },
};

// Forcing a clean rebuild to apply the new public base URL environment variable.
// This comment forces a rebuild to fix dynamic routing issues.
module.exports = withPWA(nextConfig);
