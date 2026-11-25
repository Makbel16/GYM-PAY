import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarHeight } from '../../src/components/CustomHeader';

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#86EFAC',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#022413',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.16,
          shadowRadius: 8,
          elevation: 8,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard', 'Dashboard'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: t('members', 'Members'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: t('payments', 'Payments'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet" size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings', 'Settings'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={22} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
