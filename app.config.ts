import type { ExpoConfig } from 'expo/config';

const appJson = require('./app.json') as { expo: ExpoConfig };

function normalizeBaseUrl(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '/') return '';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

export default (): ExpoConfig => {
  const config = appJson.expo;
  const baseUrl = normalizeBaseUrl(
    process.env.EXPO_PUBLIC_BASE_URL ?? process.env.EXPO_BASE_URL ?? ''
  );

  return {
    ...config,
    experiments: {
      ...(config.experiments ?? {}),
      ...(baseUrl ? { baseUrl } : {}),
    },
    extra: {
      ...(config.extra ?? {}),
      baseUrl,
    },
  };
};
