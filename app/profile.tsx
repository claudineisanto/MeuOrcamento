import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import ScreenWrapper from '@/components/app/ScreenWrapper';
import DetailHeader from '@/components/app/DetailHeader';
import Card from '@/components/app/Card';

import { AppColors, Radius, Shadow } from '@/constants/theme';
import { AppData } from '@/types';
import {
  exportBackupFile,
  getAppData,
  hashPin,
  importBackupFile,
  saveAppData,
} from '@/services/storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hasPinConfigured, setHasPinConfigured] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const appData = await getAppData();
        setData(appData);
        setUserName(appData.profile.userName || appData.profile.familyName || '');
        setAvatar(appData.profile.avatar || null);
        setHasPinConfigured(!!appData.security?.pinHash);
      };
      load();
    }, [])
  );

  const handlePickImage = async (useCamera: boolean) => {
    try {
      const opts: ImagePicker.ImagePickerOptions = {
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.4,
        base64: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setAvatar(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setAvatar(asset.uri);
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel selecionar a imagem. Tente novamente.' });
      if (Platform.OS !== 'web') {
        Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
      }
    }
  };

  const handleRemoveAvatar = () => {
    if (Platform.OS === 'web') {
      setAvatar(null);
      setFeedback({ type: 'success', message: 'Foto de perfil removida.' });
      return;
    }

    Alert.alert('Remover foto', 'Deseja remover a foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          setAvatar(null);
          setFeedback({ type: 'success', message: 'Foto de perfil removida.' });
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!data) return;
    const trimmedName = userName.trim();
    if (!trimmedName) {
      setFeedback({ type: 'error', message: 'Informe o seu nome para salvar o perfil.' });
      if (Platform.OS !== 'web') {
        Alert.alert('Atenção', 'Informe o seu nome.');
      }
      return;
    }

    const normalizedPin = pin.replace(/\D/g, '');
    const normalizedConfirmPin = confirmPin.replace(/\D/g, '');
    if (normalizedPin || normalizedConfirmPin) {
      if (normalizedPin.length < 4 || normalizedPin.length > 8) {
        setFeedback({ type: 'error', message: 'O PIN deve ter entre 4 e 8 numeros.' });
        return;
      }
      if (normalizedPin !== normalizedConfirmPin) {
        setFeedback({ type: 'error', message: 'A confirmacao do PIN nao confere.' });
        return;
      }
    }

    try {
      setSaving(true);
      setFeedback(null);
      const newData: AppData = JSON.parse(JSON.stringify(data));
      newData.profile.userName = trimmedName;
      newData.profile.familyName = trimmedName;
      newData.profile.avatar = avatar;
      if (normalizedPin) {
        newData.security.pinHash = await hashPin(normalizedPin);
        newData.security.pinEnabledAt = new Date().toISOString();
      }
      await saveAppData(newData);
      setData(newData);
      setHasPinConfigured(!!newData.security.pinHash);
      setPin('');
      setConfirmPin('');
      setFeedback({
        type: 'success',
        message: normalizedPin
          ? 'Perfil salvo e PIN atualizado com sucesso.'
          : 'Perfil salvo com sucesso.',
      });
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel salvar o perfil.' });
      if (Platform.OS !== 'web') {
        Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePin = async () => {
    if (!data || !hasPinConfigured) return;
    try {
      setSaving(true);
      setFeedback(null);
      const newData: AppData = JSON.parse(JSON.stringify(data));
      newData.security.pinHash = null;
      newData.security.pinEnabledAt = null;
      await saveAppData(newData);
      setData(newData);
      setHasPinConfigured(false);
      setPin('');
      setConfirmPin('');
      setFeedback({ type: 'success', message: 'PIN removido deste dispositivo.' });
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel remover o PIN.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      setBackupBusy(true);
      setFeedback(null);
      const out = await exportBackupFile(data ?? undefined);
      setFeedback({
        type: 'success',
        message:
          Platform.OS === 'web'
            ? `Backup baixado com sucesso: ${out}`
            : 'Backup gerado com sucesso. Escolha onde compartilhar ou salvar o arquivo.',
      });
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel exportar o backup.' });
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      setBackupBusy(true);
      setFeedback(null);
      const imported = await importBackupFile();
      if (!imported) return;
      setData(imported);
      setUserName(imported.profile.userName || imported.profile.familyName || '');
      setAvatar(imported.profile.avatar || null);
      setHasPinConfigured(!!imported.security?.pinHash);
      setPin('');
      setConfirmPin('');
      setFeedback({
        type: 'success',
        message: 'Backup importado com sucesso. Os dados deste dispositivo foram atualizados.',
      });
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel importar o backup.' });
    } finally {
      setBackupBusy(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '👤';
    const first = parts[0][0]?.toUpperCase() || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() : '';
    return (first + last) || '👤';
  };

  return (
    <ScreenWrapper title="MEU PERFIL">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <DetailHeader
          title="Meu Perfil"
          onBack={() => router.back()}
          showEdit={false}
        />

        {feedback && (
          <View
            style={[
              styles.feedbackBox,
              feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
            ]}>
            <Text
              style={[
                styles.feedbackText,
                feedback.type === 'success' ? styles.feedbackSuccessText : styles.feedbackErrorText,
              ]}>
              {feedback.message}
            </Text>
          </View>
        )}

        <Card>
          <Text style={styles.sectionTitle}>Foto do Perfil</Text>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarPlaceholder}>{getInitials(userName)}</Text>
              )}
            </View>

            <View style={styles.avatarButtons}>
              <TouchableOpacity
                style={styles.avatarButton}
                activeOpacity={0.8}
                onPress={() => handlePickImage(false)}
              >
                <Text style={styles.avatarButtonText}>📷 Galeria</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.avatarButton, styles.avatarButtonSecondary]}
                activeOpacity={0.8}
                onPress={() => handlePickImage(true)}
              >
                <Text style={styles.avatarButtonText}>📸 Câmera</Text>
              </TouchableOpacity>
              {avatar && (
                <TouchableOpacity
                  style={[styles.avatarButton, styles.avatarButtonDanger]}
                  activeOpacity={0.6}
                  onPress={handleRemoveAvatar}
                >
                  <Text style={[styles.avatarButtonText, { color: AppColors.warning }]}>
                    🗑️ Remover
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Seus Dados</Text>

          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: João Silva ou Família Silva"
            value={userName}
            onChangeText={setUserName}
            maxLength={50}
            placeholderTextColor={AppColors.text.tertiary}
          />

          <Text style={styles.hint}>
            Este nome aparecerá no cabeçalho (saudação Olá, ...) e como inicial na foto se você não adicionar imagem.
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>🔒 Proteção por PIN</Text>
          <Text style={styles.hint}>
            O PIN protege os dados salvos neste dispositivo. Ele é solicitado ao abrir o app.
          </Text>
          <Text style={styles.pinStatus}>
            {hasPinConfigured ? 'PIN configurado neste dispositivo.' : 'Nenhum PIN configurado.'}
          </Text>

          <Text style={styles.label}>Novo PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite de 4 a 8 numeros"
            value={pin}
            onChangeText={(value) => setPin(value.replace(/\D/g, ''))}
            keyboardType="numeric"
            maxLength={8}
            secureTextEntry
            placeholderTextColor={AppColors.text.tertiary}
          />

          <Text style={styles.label}>Confirmar PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Repita o PIN"
            value={confirmPin}
            onChangeText={(value) => setConfirmPin(value.replace(/\D/g, ''))}
            keyboardType="numeric"
            maxLength={8}
            secureTextEntry
            placeholderTextColor={AppColors.text.tertiary}
          />

          {hasPinConfigured && (
            <TouchableOpacity
              style={[styles.inlineDangerButton, saving && { opacity: 0.5 }]}
              onPress={handleRemovePin}
              activeOpacity={0.8}
              disabled={saving}>
              <Text style={styles.inlineDangerButtonText}>Remover PIN</Text>
            </TouchableOpacity>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>💾 Backup dos Dados</Text>
          <Text style={styles.hint}>
            Exporte um arquivo JSON com seus dados para backup e importe esse mesmo arquivo quando quiser restaurar o app.
          </Text>

          <View style={styles.backupButtons}>
            <TouchableOpacity
              style={[styles.actionButton, backupBusy && { opacity: 0.6 }]}
              onPress={handleExportBackup}
              activeOpacity={0.8}
              disabled={backupBusy}>
              <Text style={styles.actionButtonText}>Exportar backup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryActionButton, backupBusy && { opacity: 0.6 }]}
              onPress={handleImportBackup}
              activeOpacity={0.8}
              disabled={backupBusy}>
              <Text style={styles.actionButtonText}>Importar backup</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {Platform.OS === 'web' && (
          <Card>
            <Text style={styles.sectionTitle}>🖥️ Instalar como App</Text>
            <Text style={styles.hint}>
              No Chrome ou Edge, abra o menu do navegador e use a opção "Instalar aplicativo" ou "Instalar este site como app" para usar o Meu Orçamento como PWA.
            </Text>
          </Card>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Salvando...' : '💾 Salvar Perfil'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
    color: AppColors.text.primary,
    fontSize: 15,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 20,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: AppColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'white',
    ...Shadow.card,
  },
  avatarImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  avatarPlaceholder: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 48,
  },
  avatarButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  avatarButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.xxl,
    ...Shadow.fab,
  },
  avatarButtonSecondary: {
    backgroundColor: AppColors.blue,
  },
  avatarButtonDanger: {
    backgroundColor: AppColors.alert.debt,
    borderWidth: 1,
    borderColor: AppColors.warning,
    ...Platform.select({
      web: { boxShadow: 'none' as any },
      default: { shadowColor: 'transparent' as any },
    }),
  },
  avatarButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  label: {
    fontWeight: '600',
    color: AppColors.text.primary,
    marginTop: 5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.md,
    fontSize: 16,
    color: AppColors.text.primary,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 18,
  },
  feedbackBox: {
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  feedbackError: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  feedbackSuccessText: {
    color: '#2E7D32',
  },
  feedbackErrorText: {
    color: '#C62828',
  },
  pinStatus: {
    color: AppColors.text.secondary,
    fontSize: 13,
    marginBottom: 6,
  },
  inlineDangerButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: AppColors.alert.debt,
    borderRadius: Radius.xxl,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColors.warning,
  },
  inlineDangerButtonText: {
    color: AppColors.warning,
    fontWeight: '700',
  },
  backupButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.xxl,
    ...Shadow.fab,
  },
  secondaryActionButton: {
    backgroundColor: AppColors.blue,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    ...Shadow.fab,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
