import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { AppColors } from '@/constants/theme';

interface ScreenWrapperProps extends ViewProps {
  title?: string;
}

export default function ScreenWrapper({ title, children, style }: ScreenWrapperProps) {
  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 12,
    color: AppColors.text.secondary,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
