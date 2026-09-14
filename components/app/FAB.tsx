import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors, Radius, Shadow } from '@/constants/theme';
import { ReactNode } from 'react';

interface FABProps {
  onPress?: () => void;
  children: ReactNode;
}

export default function FAB({ onPress, children }: FABProps) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: Radius.xxl,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.fab,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
