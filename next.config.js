const path = require('path');
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
    // **La pantalla de entrada nunca sale de la memoria del telefono.**
    //
    // Paso de verdad: el dueno apretaba "Ingresar" y no pasaba absolutamente nada.
    // Ni el cartel de "Ingresando...", ni un error. El boton, muerto.
    //
    // Una pagina guardada en la memoria del navegador se sirve con el programa de
    // la version vieja. Si ese programa ya no coincide con la pagina, la pantalla se
    // dibuja igual —se ve perfecta— pero **ningun boton responde**. Y como queda
    // guardada, el problema no se arregla solo: se repite en cada visita.
    //
    // Con esto, la entrada y la recuperacion de clave se piden siempre al servidor.
    // Es la unica puerta de la app: si se queda pegada, no hay forma de entrar a
    // arreglarla desde adentro.
    navigateFallbackDenylist: [/^\/login/, /^\/api\//],
    runtimeCaching: [
      {
        urlPattern: /^\/login(\?.*)?$/,
        handler: 'NetworkOnly',
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windows without Developer Mode cannot create the pnpm symlinks used by
  // Next standalone tracing. Production keeps standalone unless explicitly disabled.
  output: process.env.AK_DISABLE_STANDALONE === 'true' ? undefined : 'standalone',
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
          // Fuerza HTTPS por 1 ano solo en el host actual
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          // Controla información de referencia enviada a terceros
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permite multimedia local y desactiva geolocalizacion
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
          // Desactiva el filtro XSS obsoleto de navegadores antiguos
          { key: 'X-XSS-Protection', value: '0' },
        ],
      },
    ];
  },
  // **Una sola direccion para Google, no dos.**
  //
  // La web contesta igual con "www" adelante y sin el. Para una persona es la
  // misma pagina; para Google pueden ser dos sitios distintos con el mismo
  // contenido, y entonces reparte entre los dos lo que deberia sumar a uno solo.
  // Paso de verdad: Google tenia anotada la portada como www.akproducciones.uy
  // mientras la app se declara a si misma sin www en todos lados (el mapa del
  // sitio, la ficha del negocio y la direccion canonica de cada pagina).
  //
  // Con esto, quien entre con "www" llega igual, pero pasando por la direccion
  // buena. Es permanente a proposito: asi Google traslada a la direccion sin www
  // lo que ya tenia acumulado en la otra, en vez de empezar de cero.
  async redirects() {
    return [
      {
        source: '/:ruta*',
        has: [{ type: 'host', value: 'www.akproducciones.uy' }],
        destination: 'https://akproducciones.uy/:ruta*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/cron/despachador',
        destination: '/api/cron-despachador',
      },
    ];
  },
  transpilePackages: ['framer-motion'],
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
  webpack: (config, { webpack }) => {
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
      '@firebase/auth': path.resolve(__dirname, 'node_modules/firebase/node_modules/@firebase/auth/dist/node/index.js'),
      '@opentelemetry/exporter-jaeger': false,
      '@opentelemetry/sdk-node': false,
      'canvg': false,
      'dompurify': false,
    };

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /SemanticAttributes/,
        path.resolve(__dirname, 'src/lib/empty-mock.js')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /SemanticResourceAttributes/,
        path.resolve(__dirname, 'src/lib/empty-mock.js')
      )
    );

    return config;
  },
};

// Forcing a clean rebuild to apply the new public base URL environment variable.
// This comment forces a rebuild to fix dynamic routing issues.
module.exports = withPWA(nextConfig);
