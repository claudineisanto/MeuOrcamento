import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors } from '@/constants/theme';

interface DetailHeaderProps {
  title: string;
  onBack: () => void;
  onEdit?: () => void;
  showEdit?: boolean;
}

export default function DetailHeader({ title, onBack, onEdit, showEdit = true }: DetailHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.backButton}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      {showEdit ? (
        <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
          <Text style={styles.editButton}>Editar</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
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
  backButton: {
    fontSize: 24,
    color: AppColors.text.primary,
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: AppColors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    color: AppColors.primary,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
});
