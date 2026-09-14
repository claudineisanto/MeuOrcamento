import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColors, Radius, Shadow } from '@/constants/theme';
import { getAppData, verifyAppPin } from '@/services/storage';

export default function PinGate({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<'loading' | 'locked' | 'unlocked'>('loading');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const loadSecurityState = useCallback(async () => {
    try {
      const appData = await getAppData();
      const hasPin = !!appData.security?.pinHash;

      if (!hasPin) {
        setStatus('unlocked');
        return;
      }

      setStatus('locked');
    } catch {
      setStatus('unlocked');
    }
  }, []);

  useEffect(() => {
    loadSecurityState();
  }, [loadSecurityState]);

  const handleUnlock = async () => {
    if (checking) return;
    const normalizedPin = pin.replace(/\D/g, '');
    if (normalizedPin.length < 4) {
      setError('Informe o PIN configurado para continuar.');
      return;
    }

    try {
      setChecking(true);
      const ok = await verifyAppPin(normalizedPin);
      if (!ok) {
        setError('PIN incorreto. Tente novamente.');
        return;
      }

      setError('');
      setPin('');
      setStatus('unlocked');
    } finally {
      setChecking(false);
    }
  };

  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Carregando seguranca do app...</Text>
      </View>
    );
  }

  if (status === 'locked') {
    return (
      <View style={styles.lockContainer}>
        <View style={styles.lockCard}>
          <Text style={styles.lockTitle}>🔒 Meu Orçamento protegido</Text>
          <Text style={styles.lockSubtitle}>
            Informe seu PIN para acessar os dados deste dispositivo.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite seu PIN"
            placeholderTextColor={AppColors.text.tertiary}
            keyboardType="numeric"
            secureTextEntry
            maxLength={8}
            value={pin}
            onChangeText={(value) => {
              setPin(value.replace(/\D/g, ''));
              if (error) setError('');
            }}
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, checking && { opacity: 0.6 }]}
            onPress={handleUnlock}
            activeOpacity={0.8}
            disabled={checking}>
            <Text style={styles.buttonText}>{checking ? 'Validando...' : 'Entrar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background,
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: AppColors.text.secondary,
    fontSize: 14,
  },
  lockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background,
    padding: 24,
  },
  lockCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: AppColors.surface,
    borderRadius: Radius.xl,
    padding: 24,
    ...Shadow.card,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  lockSubtitle: {
    color: AppColors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  input: {
    backgroundColor: AppColors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  errorText: {
    color: AppColors.warning,
    fontWeight: '600',
    marginBottom: 12,
  },
  button: {
    backgroundColor: AppColors.primary,
    borderRadius: Radius.xxl,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: AppColors.text.inverse,
    fontWeight: '700',
    fontSize: 16,
  },
});
