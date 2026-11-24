import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MembershipStatus } from '../types';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: MembershipStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function StatusBadge({ status, size = 'medium', showLabel = true }: StatusBadgeProps) {
  const { t } = useTranslation();

  let config = colors.statusActive;
  let iconName: keyof typeof Ionicons.glyphMap = 'checkmark-circle';
  let label = t('active', 'ACTIVE');

  switch (status) {
    case 'active':
      config = colors.statusActive;
      iconName = 'checkmark-circle';
      label = size === 'large' ? 'PAID' : t('active', 'ACTIVE');
      break;
    case 'expired':
      config = colors.statusExpired;
      iconName = 'close-circle';
      label = t('expired', 'EXPIRED');
      break;
    case 'unpaid':
      config = colors.statusUnpaid;
      iconName = 'alert-circle';
      label = t('unpaid', 'UNPAID');
      break;
    case 'inactive':
      config = colors.statusInactive;
      iconName = 'pause-circle';
      label = 'INACTIVE';
      break;
  }

  const isLarge = size === 'large';
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        isLarge && styles.badgeLarge,
        isSmall && styles.badgeSmall,
      ]}
    >
      <Ionicons
        name={iconName}
        size={isLarge ? 18 : isSmall ? 12 : 14}
        color={config.text}
        style={styles.icon}
      />
      {showLabel && (
        <Text
          style={[
            styles.text,
            { color: config.text },
            isLarge && styles.textLarge,
            isSmall && styles.textSmall,
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 10,
  },
  textLarge: {
    fontSize: 14,
  },
});
