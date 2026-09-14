import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import PinGate from '@/components/app/PinGate';
import WebDesktopShell from '@/components/app/WebDesktopShell';
import { withBaseUrl } from '@/constants/web';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register(withBaseUrl('/sw.js')).catch(() => {});
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WebDesktopShell>
        <PinGate>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="detail"
              options={{ headerShown: false, title: 'Detalhamento' }}
            />
            <Stack.Screen
              name="meta"
              options={{ headerShown: false, title: 'Meta do Mês' }}
            />
            <Stack.Screen
              name="profile"
              options={{ headerShown: false, title: 'Meu Perfil' }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal', title: 'Novo Lançamento', headerShown: false }}
            />
          </Stack>
        </PinGate>
      </WebDesktopShell>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
