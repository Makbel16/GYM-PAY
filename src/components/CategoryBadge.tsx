import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MemberCategory } from '../types';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

interface CategoryBadgeProps {
  category: MemberCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const { t } = useTranslation();

  let bg = colors.categoryStudent.bg;
  let text = colors.categoryStudent.text;
  let border = colors.categoryStudent.border;
  let iconName: keyof typeof Ionicons.glyphMap = 'school';
  let label = t('student', 'Student');

  if (category === 'staff') {
    bg = colors.categoryStaff.bg;
    text = colors.categoryStaff.text;
    border = colors.categoryStaff.border;
    iconName = 'briefcase';
    label = t('staff', 'Staff');
  } else if (category === 'external') {
    bg = colors.categoryExternal.bg;
    text = colors.categoryExternal.text;
    border = colors.categoryExternal.border;
    iconName = 'people';
    label = t('external', 'External');
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={iconName} size={12} color={text} style={styles.icon} />
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
