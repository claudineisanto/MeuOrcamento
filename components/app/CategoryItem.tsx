import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors, Radius } from '@/constants/theme';
import ProgressBar from './ProgressBar';
import { Category, Subcategory } from '@/types';
import { formatCurrency } from '@/services/storage';

interface CategoryItemProps {
  category: Category;
  variant?: 'default' | 'credit' | 'warning';
  onPress?: () => void;
  referenceMax?: number;
}

export default function CategoryItem({
  category,
  variant = 'default',
  onPress,
  referenceMax = 0,
}: CategoryItemProps) {
  const catIcon = typeof category?.icon === 'string' && category.icon.length > 0 ? category.icon : '💡';
  const catName = typeof category?.name === 'string' && category.name.length > 0 ? category.name : 'Categoria';
  const catBudget = Number(category?.budget) || 0;
  const catSpent = Number(category?.spent) || 0;

  let progress = 0;
  if (catBudget > 0) {
    progress = (catSpent / catBudget) * 100;
  } else if (referenceMax > 0 && catSpent > 0) {
    progress = Math.min(100, catSpent / referenceMax * 100);
  }
  if (!isFinite(progress) || progress < 0) progress = 0;
  const barVariant =
    variant === 'credit'
      ? 'credit'
      : catBudget > 0 && progress >= 85
      ? 'warning'
      : 'default';

  const CategoryContent = (
    <View>
      <View style={styles.categoryItem}>
        <View style={styles.icon}>
          <Text style={{ fontSize: 20 }}>{catIcon}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name}>{catName}</Text>
            <Text style={styles.value}>{formatCurrency(catSpent)}</Text>
          </View>
          <ProgressBar progress={progress} variant={barVariant} />
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {CategoryContent}
      </TouchableOpacity>
    );
  }

  return CategoryContent;
}

interface SubcategoryListProps {
  subcategories: Subcategory[];
  categoryId: string;
  parentBudget?: number;
  getSubcategorySpent?: (subcategoryId: string) => number;
}

export function SubcategoryList({ subcategories, getSubcategorySpent }: SubcategoryListProps) {
  const safeList = Array.isArray(subcategories) ? subcategories : [];
  return (
    <View style={subcategoryStyles.container}>
      {safeList.map((sub, idx) => {
        const subId = typeof sub?.id === 'string' && sub.id.length > 0 ? sub.id : `sub-${idx}`;
        const subIcon = typeof sub?.icon === 'string' && sub.icon.length > 0 ? sub.icon : '•';
        const subName = typeof sub?.name === 'string' && sub.name.length > 0 ? sub.name : 'Subcategoria';
        const spent = getSubcategorySpent ? Number(getSubcategorySpent(subId)) || 0 : 0;
        const subBudget = Number(sub?.budget) || 0;
        const labelStr = `${subIcon} ${subName}`;
        return (
          <View key={subId} style={subcategoryStyles.item}>
            <Text style={subcategoryStyles.name}>{labelStr}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={subcategoryStyles.value}>{formatCurrency(spent)}</Text>
              {subBudget > 0 && (
                <Text style={subcategoryStyles.limit}>
                  {` / ${formatCurrency(subBudget)}`}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  icon: {
    width: 40,
    height: 40,
    backgroundColor: AppColors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  name: {
    fontWeight: '500',
    color: AppColors.text.primary,
  },
  value: {
    color: AppColors.text.secondary,
  },
});

const subcategoryStyles = StyleSheet.create({
  container: {
    marginLeft: 52,
    marginTop: 5,
    marginBottom: 10,
    padding: 10,
    backgroundColor: AppColors.background,
    borderRadius: Radius.md,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
    borderStyle: 'dashed',
  },
  name: {
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  value: {
    fontWeight: '500',
    color: AppColors.warning,
  },
  limit: {
    fontSize: 12,
    color: AppColors.primary,
  },
});
