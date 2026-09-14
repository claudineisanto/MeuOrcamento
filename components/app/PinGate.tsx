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

const SECURITY_LOAD_TIMEOUT_MS = 4000;

export default function PinGate({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<'loading' | 'locked' | 'unlocked'>('loading');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const loadSecurityState = useCallback(async () => {
    try {
      const appData = await Promise.race([
        getAppData(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('security_load_timeout')), SECURITY_LOAD_TIMEOUT_MS)
        ),
      ]);
      const hasPin = !!appData.security?.pinHash;

      if (!hasPin) {
        setError('');
        setStatus('unlocked');
        return;
      }

      setError('');
      setStatus('locked');
    } catch {
      // Se a leitura inicial falhar ou travar, não bloqueamos o app em loading infinito.
      setError('Nao foi possivel validar a seguranca automaticamente. O app foi liberado para continuar.');
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
        {!!error && <Text style={styles.loadingErrorText}>{error}</Text>}
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
    textAlign: 'center',
  },
  loadingErrorText: {
    color: AppColors.warning,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 360,
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
