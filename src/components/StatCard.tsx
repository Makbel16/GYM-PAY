import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  variant: 'green' | 'blue' | 'orange' | 'red';
  onPress?: () => void;
}

export function StatCard({ title, value, icon, variant, onPress }: StatCardProps) {
  let bgColor = colors.statGreenBg;
  let iconColor = colors.statGreenIcon;

  switch (variant) {
    case 'green':
      bgColor = colors.statGreenBg;
      iconColor = colors.statGreenIcon;
      break;
    case 'blue':
      bgColor = colors.statBlueBg;
      iconColor = colors.statBlueIcon;
      break;
    case 'orange':
      bgColor = colors.statOrangeBg;
      iconColor = colors.statOrangeIcon;
      break;
    case 'red':
      bgColor = colors.statRedBg;
      iconColor = colors.statRedIcon;
      break;
  }

  const Content = (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.touchable}>
        {Content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.touchable}>{Content}</View>;
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    minWidth: '47%',
    margin: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
