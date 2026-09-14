import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { AppColors } from '@/constants/theme';

interface HeaderProps {
  metaPercentage: number;
  monthlyGoal?: number;
  profileInitial?: string;
  avatar?: string | null;
  userName?: string;
  onProfilePress?: () => void;
  onMetaPress?: () => void;
}

function getInitials(name?: string, fallback?: string): string {
  const raw = (name || '').trim();
  if (raw) {
    const parts = raw.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0]?.toUpperCase() || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() : '';
    if (first) return first + (last || '');
  }
  return fallback || '👤';
}

export default function Header({
  metaPercentage,
  monthlyGoal,
  profileInitial,
  avatar = null,
  userName,
  onProfilePress,
  onMetaPress,
}: HeaderProps) {
  const router = useRouter();
  const handleProfile = () => {
    if (onProfilePress) onProfilePress();
    else router.push('/profile' as any);
  };
  const handleMeta = () => {
    if (onMetaPress) onMetaPress();
    else router.push('/meta' as any);
  };

  const hasAvatar = !!avatar;
  const initial = getInitials(userName, profileInitial);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <TouchableOpacity onPress={handleMeta} activeOpacity={0.85}>
          <View style={[styles.metaIndicator, monthlyGoal ? styles.metaWithGoal : null]}>
            <Text style={styles.metaText}>
              🔔 Meta: {metaPercentage}%
              {monthlyGoal ? ` (objetivo definido)` : ''}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleProfile} activeOpacity={0.8}>
        <View style={styles.profile}>
          {hasAvatar ? (
            <Image source={{ uri: avatar as string }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Text style={styles.profileText}>{initial}</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  left: {
    flexDirection: 'row',
    gap: 10,
  },
  metaIndicator: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaWithGoal: {
    backgroundColor: AppColors.blue,
  },
  metaText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  profile: {
    width: 40,
    height: 40,
    backgroundColor: AppColors.blue,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
