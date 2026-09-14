import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors, Radius } from '@/constants/theme';

export interface FilterOption {
  id: string;
  label: string;
  icon?: string;
}

interface FilterChipsProps {
  filters: FilterOption[];
  activeFilter: string;
  onSelect: (id: string) => void;
}

export default function FilterChips({ filters, activeFilter, onSelect }: FilterChipsProps) {
  return (
    <View style={styles.container}>
      {filters.map((filter) => {
        const isActive = filter.id === activeFilter;
        return (
          <TouchableOpacity
            key={filter.id}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(filter.id)}
            activeOpacity={0.8}
          >
            {filter.icon && <Text style={styles.icon}>{filter.icon}</Text>}
            <Text style={[styles.label, isActive && styles.labelActive]}>{filter.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 20,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipActive: {
    backgroundColor: AppColors.primary,
  },
  label: {
    fontSize: 14,
    color: AppColors.text.primary,
  },
  labelActive: {
    color: 'white',
  },
  icon: {
    fontSize: 14,
  },
});
