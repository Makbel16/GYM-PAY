import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

interface Slice {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface DonutChartProps {
  activeCount: number;
  expiredCount: number;
  unpaidCount: number;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({
  activeCount,
  expiredCount,
  unpaidCount,
  size = 140,
  strokeWidth = 22,
}: DonutChartProps) {
  const total = activeCount + expiredCount + unpaidCount;

  const slices: Slice[] = [
    { key: 'active', label: 'Active', count: activeCount, color: colors.statusActive.dot },
    { key: 'expired', label: 'Expired', count: expiredCount, color: colors.statusExpired.dot },
    { key: 'unpaid', label: 'Unpaid', count: unpaidCount, color: colors.statusUnpaid.dot },
  ];

  if (total === 0) {
    return (
      <View style={styles.container}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
        <View style={styles.legend}>
          {slices.map((slice) => (
            <View key={slice.key} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
              <Text style={styles.legendLabel}>{slice.label}</Text>
              <Text style={styles.legendCount}>0</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Calculate SVG arc segments
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = -Math.PI / 2;

  const paths = slices.map((slice) => {
    if (slice.count === 0) return null;
    const fraction = slice.count / total;
    const angle = fraction * 2 * Math.PI;

    // Use SVG dasharray approach for perfect antialiased donut rings
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const rotation = (cumulativeAngle * 180) / Math.PI + 90;
    cumulativeAngle += angle;

    return (
      <Circle
        key={slice.key}
        cx={center}
        cy={center}
        r={radius}
        stroke={slice.color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={0}
        origin={`${center}, ${center}`}
        rotation={rotation}
        fill="none"
      />
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G>{paths}</G>
        </Svg>
        <View style={styles.centerText}>
          <Text style={styles.centerNumber}>{total}</Text>
          <Text style={styles.centerLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {slices.map((slice) => (
          <View key={slice.key} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
            <Text style={styles.legendLabel}>{slice.label}</Text>
            <Text style={styles.legendCount}>{slice.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  centerLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  legend: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  legendCount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
