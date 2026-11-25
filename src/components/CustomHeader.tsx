import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  rightAction?: React.ReactNode;
  dark?: boolean;
  fadeToColor?: string;
}

export const getTabBarHeight = (bottomInset: number) =>
  62 + Math.max(bottomInset, 4);

export interface GymScreenContainerProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  showBack?: boolean;
  hasBottomTabBar?: boolean;
  rightAction?: React.ReactNode;
  sheetBackgroundColor?: string;
  children: React.ReactNode;
}

/**
 * Shared top header wave using ONLY the upper portion of BG2.png (athlete + emerald curve).
 */
export function HeaderWaveBackground({
  height,
  fadeToColor = '#FFFFFF',
}: {
  height: number;
  fadeToColor?: string;
}) {
  const { width: screenWidth } = useWindowDimensions();
  // BG2.png is 1024x1536 (ratio 2:3); top green wave ends around 24.5% of image height
  const topBgHeight = Math.max(screenWidth * 1.5, height / 0.245);
  const topBgOffsetY = height - topBgHeight * 0.245;

  return (
    <View style={[styles.headerBgWrapper, { height }]} pointerEvents="none">
      <Image
        source={require('../../assets/images/BG2.png')}
        style={[
          styles.headerBgImage,
          {
            width: screenWidth,
            height: topBgHeight,
            top: Math.min(0, topBgOffsetY),
          },
        ]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(2, 24, 12, 0.34)', 'rgba(2, 26, 14, 0.46)', 'transparent']}
        locations={[0, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      {fadeToColor !== '#FFFFFF' && (
        <LinearGradient
          colors={['transparent', fadeToColor]}
          style={styles.bottomEdgeFade}
        />
      )}
    </View>
  );
}

/**
 * Reusable emerald gradient action pill matching the "+ Add" button on Members.
 */
export function HeaderActionPill({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.pillBtnShadow}
    >
      <LinearGradient
        colors={['#22C55E', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pillBtnGradient}
      >
        {icon && <Ionicons name={icon} size={17} color="#FFFFFF" />}
        <Text style={styles.pillBtnText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Reusable translucent circular header icon button for secondary actions.
 */
export function HeaderIconCircle({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.iconCircleBtn}
    >
      <Ionicons name={icon} size={19} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

/**
 * Shared screen wrapper for main pages (Dashboard, Members, Settings, Register)
 * displaying only the top athlete & wavy emerald portion of BG2.png in the header.
 */
export function GymScreenContainer({
  title,
  subtitle,
  icon = 'barbell',
  showBack = false,
  hasBottomTabBar = true,
  rightAction,
  sheetBackgroundColor = '#FFFFFF',
  children,
}: GymScreenContainerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = Math.max(insets.top + 104, 144);

  return (
    <View style={[styles.rootContainer, { backgroundColor: sheetBackgroundColor }]}>
      <StatusBar style="light" />

      <View style={[styles.waveHeaderContainer, { height: headerHeight }]}>
        <HeaderWaveBackground height={headerHeight} fadeToColor={sheetBackgroundColor} />

        <View
          style={[
            styles.tabHeaderRow,
            {
              paddingTop: Math.max(insets.top + 8, 42),
              paddingBottom: 24,
            },
          ]}
        >
          <View style={styles.headerLeftGroup}>
            {showBack ? (
              <TouchableOpacity
                style={[styles.backButton, { marginRight: 2 }]}
                onPress={() => router.back()}
                activeOpacity={0.75}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <LinearGradient
                colors={['#22C55E', '#058C42']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerBadgeCircle}
              >
                <Ionicons name={icon} size={25} color="#FFFFFF" />
              </LinearGradient>
            )}

            <View style={styles.headerTextCol}>
              <Text style={styles.tabHeaderTitle} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.tabHeaderSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>

          {rightAction ? <View style={styles.rightActionsRow}>{rightAction}</View> : null}
        </View>
      </View>

      <View
        style={[
          styles.contentBody,
          {
            backgroundColor: sheetBackgroundColor,
            paddingBottom: hasBottomTabBar ? getTabBarHeight(insets.bottom) : 0,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * Unified top header bar for pushed/stack screens (Details, Edit, Record Payment, Reports, Plans).
 */
export function CustomHeader({
  title,
  subtitle,
  showBack = false,
  icon = 'barbell',
  rightAction,
  fadeToColor = '#F8FAFC',
}: CustomHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { admin } = useAuth();
  const headerHeight = Math.max(insets.top + 96, 136);

  const adminInitials = admin?.full_name
    ? admin.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  return (
    <View style={[styles.waveHeaderContainer, { height: headerHeight }]}>
      <StatusBar style="light" />
      <HeaderWaveBackground height={headerHeight} fadeToColor={fadeToColor} />

      <View
        style={[
          styles.stackHeaderContent,
          {
            paddingTop: Math.max(insets.top + 6, 40),
            paddingBottom: 22,
          },
        ]}
      >
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back" size={23} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <LinearGradient
            colors={['#22C55E', '#058C42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.stackBadgeCircle}
          >
            <Ionicons name={icon} size={20} color="#FFFFFF" />
          </LinearGradient>
        )}

        <View style={styles.stackTitleContainer}>
          <Text style={styles.stackTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.stackSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <View style={styles.rightActionsRow}>{rightAction}</View>
        ) : (
          <View style={styles.avatarPill}>
            <Text style={styles.avatarText}>{adminInitials}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  waveHeaderContainer: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#022211',
    justifyContent: 'center',
  },
  headerBgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  headerBgImage: {
    position: 'absolute',
    left: 0,
  },
  bottomEdgeFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 14,
  },
  tabHeaderRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerBadgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  tabHeaderTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  tabHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 1,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillBtnShadow: {
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pillBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 22,
    gap: 4,
  },
  pillBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBody: {
    flex: 1,
  },
  stackHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    marginRight: 12,
  },
  stackBadgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stackTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  stackTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  stackSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 1,
  },
  avatarPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#4ADE80',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
