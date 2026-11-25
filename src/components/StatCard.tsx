import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant: 'green' | 'blue' | 'orange' | 'red';
  onPress?: () => void;
}

export function StatCard({ title, value, variant, onPress }: StatCardProps) {
  let bgColor = '#E8F7ED';
  let valueColor = '#0F172A';
  let titleColor = '#1E293B';
  let iconElement: React.ReactNode = null;

  switch (variant) {
    case 'green':
      bgColor = '#E8F7ED';
      valueColor = '#0F172A';
      titleColor = '#1E293B';
      iconElement = <Ionicons name="people" size={28} color="#058C42" />;
      break;
    case 'blue':
      bgColor = '#EAF3FF';
      valueColor = '#0F172A';
      titleColor = '#1E293B';
      iconElement = (
        <View style={[styles.solidCircle, { backgroundColor: '#2585F5' }]}>
          <Ionicons name="checkmark" size={17} color="#FFFFFF" />
        </View>
      );
      break;
    case 'orange':
      bgColor = '#FFF3DF';
      valueColor = '#8A3B00';
      titleColor = '#78350F';
      iconElement = (
        <View style={[styles.solidCircle, { backgroundColor: '#F59E0B' }]}>
          <Svg width={28} height={28} viewBox="0 0 28 28">
            <Circle cx="14" cy="14" r="14" fill="#F59E0B" />
            <Path
              d="M14 7.5V14.2L18.2 16.5"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>
      );
      break;
    case 'red':
      bgColor = '#FFEAE9';
      valueColor = '#B91C1C';
      titleColor = '#B91C1C';
      iconElement = (
        <View style={[styles.solidCircle, { backgroundColor: '#DC2626' }]}>
          <Text style={styles.exclamationText}>!</Text>
        </View>
      );
      break;
  }

  const Content = (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={styles.iconContainer}>{iconElement}</View>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
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
    margin: 5,
  },
  card: {
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  solidCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  exclamationText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 19,
  },
  value: {
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});
