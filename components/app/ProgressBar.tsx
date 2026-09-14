import { View, StyleSheet } from 'react-native';
import { AppColors } from '@/constants/theme';

interface ProgressBarProps {
  progress: number;
  variant?: 'default' | 'warning' | 'credit';
  height?: number;
  fillColor?: string;
  trackColor?: string;
}

export default function ProgressBar({
  progress,
  variant = 'default',
  height = 10,
  fillColor,
  trackColor,
}: ProgressBarProps) {
  const resolvedFillColor =
    fillColor ??
    (variant === 'warning'
      ? AppColors.warning
      : variant === 'credit'
      ? AppColors.credit
      : AppColors.primary);

  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.container, { height, backgroundColor: trackColor || AppColors.divider }]}>
      <View style={[styles.fill, { width: `${safeProgress}%`, backgroundColor: resolvedFillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.divider,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 10,
  },
});
