import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { withBaseUrl } from '@/constants/web';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#2E7D32" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Meu Orçamento" />
        <link rel="icon" href={withBaseUrl('/icon-192.png')} />
        <link rel="manifest" href={withBaseUrl('/manifest.json')} />
        <link rel="apple-touch-icon" href={withBaseUrl('/icon-192.png')} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
