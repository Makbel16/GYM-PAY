import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface GymLogoProps {
  size?: 'small' | 'medium' | 'large';
  showSubtitle?: boolean;
}

export function GymLogo({ size = 'large', showSubtitle = true }: GymLogoProps) {
  const iconSize = size === 'large' ? 68 : size === 'medium' ? 44 : 32;

  return (
    <View style={styles.container}>
      <View style={[styles.iconRing, size === 'small' && styles.iconRingSmall]}>
        <MaterialCommunityIcons name="weight-lifter" size={iconSize} color={colors.primaryVibrant} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, size === 'small' && styles.titleSmall]}>
          DBU <Text style={styles.titleHighlight}>Gym</Text>
        </Text>
        <Text style={styles.trackerText}>Payment Tracker</Text>
        {showSubtitle && (
          <View style={styles.subContainer}>
            <Text style={styles.subtitle}>Debre Berhan University</Text>
            <Text style={styles.subtitleGym}>Gym Management</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconRingSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    marginBottom: 6,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  titleSmall: {
    fontSize: 18,
  },
  titleHighlight: {
    color: colors.primaryVibrant,
  },
  trackerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryVibrant,
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  subContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  subtitleGym: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
});
