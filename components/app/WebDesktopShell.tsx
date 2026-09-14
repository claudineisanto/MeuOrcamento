import { PropsWithChildren, useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AppColors, Shadow } from '@/constants/theme';

const DESKTOP_BREAKPOINT = 920;

export default function WebDesktopShell({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      setMounted(true);
    }
  }, []);

  if (Platform.OS !== 'web' || !mounted || width < DESKTOP_BREAKPOINT) {
    return <>{children}</>;
  }

  return (
    <View style={styles.page}>
      <View style={styles.brandPanel}>
        <View style={styles.brandContent}>
          <View style={styles.visualStage}>
            <Image
              source={require('../../assets/images/svg/icon1.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>Meu Orçamento</Text>
            <Text style={styles.brandSubtitle}>
              Um jeito mais claro e confortável de acompanhar receitas, despesas e metas no
              computador.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.appPanel}>
        <View style={styles.appFrame}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EAF3EC',
  },
  brandPanel: {
    flex: 0.95,
    backgroundColor: '#2F7D32',
    paddingHorizontal: 32,
    paddingVertical: 28,
  },
  brandContent: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    gap: 16,
  },
  visualStage: {
    flex: 1,
    minHeight: 0,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...({
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 20px 50px rgba(18, 45, 21, 0.16)',
    } as any),
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  brandCopy: {
    paddingHorizontal: 6,
  },
  brandTitle: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '800',
    color: AppColors.text.inverse,
    marginBottom: 12,
  },
  brandSubtitle: {
    fontSize: 18,
    lineHeight: 30,
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 380,
  },
  appPanel: {
    flex: 1.05,
    paddingHorizontal: 40,
    paddingVertical: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7F5',
  },
  appFrame: {
    width: '100%',
    maxWidth: 560,
    height: '100%',
    maxHeight: 920,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.12)',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 24px 60px rgba(25, 53, 29, 0.14)' } as any)
      : Shadow.card),
  },
});
