const fs = require('node:fs');
const path = require('node:path');

function normalizeBaseUrl(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === '/') return '';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

function withBaseUrl(baseUrl, pathname) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

const baseUrl = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_BASE_URL || process.env.EXPO_BASE_URL || ''
);
const publicDir = path.join(process.cwd(), 'public');
const manifestPath = path.join(publicDir, 'manifest.json');
const swPath = path.join(publicDir, 'sw.js');

const manifest = {
  short_name: 'Orcamento',
  name: 'Meu Orçamento',
  description: 'Controle seus gastos, metas e receitas em um app instalável.',
  start_url: baseUrl ? `${baseUrl}/` : '/',
  scope: baseUrl ? `${baseUrl}/` : '/',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#2E7D32',
  background_color: '#F8F9FA',
  icons: [
    {
      src: withBaseUrl(baseUrl, '/icon-192.png'),
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable',
    },
    {
      src: withBaseUrl(baseUrl, '/icon-512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable',
    },
  ],
};

const swSource = `const CACHE_NAME = 'meu-orcamento-pwa-v1${baseUrl ? `-${baseUrl.replace(/[^a-z0-9]/gi, '-')}` : ''}';
const BASE_URL = ${JSON.stringify(baseUrl)};
const CORE_ASSETS = [
  withBaseUrl('/'),
  withBaseUrl('/manifest.json'),
  withBaseUrl('/icon-192.png'),
  withBaseUrl('/icon-512.png'),
];

function withBaseUrl(pathname) {
  const normalizedPath = pathname.startsWith('/') ? pathname : \`/\${pathname}\`;
  return BASE_URL ? \`\${BASE_URL}\${normalizedPath}\` : normalizedPath;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (BASE_URL && !url.pathname.startsWith(BASE_URL)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) || (await caches.match(withBaseUrl('/')));
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
fs.writeFileSync(swPath, swSource + '\n', 'utf8');

console.log(`Arquivos web preparados com baseUrl="${baseUrl || '/'}".`);
