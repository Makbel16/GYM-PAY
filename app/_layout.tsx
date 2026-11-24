import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '../src/database/db';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme/colors';
import '../src/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});

function NavigationGate() {
  const { admin, isLoading, hasAdmin } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!admin && !inAuthGroup) {
      if (!hasAdmin) {
        router.replace('/(auth)/setup' as any);
      } else {
        router.replace('/(auth)/login' as any);
      }
    } else if (admin && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [admin, isLoading, hasAdmin, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.navyDark, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primaryVibrant} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="members/register" options={{ headerShown: false }} />
      <Stack.Screen name="members/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="members/edit" options={{ headerShown: false }} />
      <Stack.Screen name="members/search" options={{ headerShown: false }} />
      <Stack.Screen name="payments/record" options={{ headerShown: false }} />
      <Stack.Screen name="payments/history" options={{ headerShown: false }} />
      <Stack.Screen name="payments/receipt" options={{ headerShown: false }} />
      <Stack.Screen name="reports/index" options={{ headerShown: false }} />
      <Stack.Screen name="settings/plans" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SQLiteProvider databaseName="dbu_gym.db" onInit={initializeDatabase}>
      <AuthProvider>
        <LanguageProvider>
          <NavigationGate />
        </LanguageProvider>
      </AuthProvider>
    </SQLiteProvider>
  );
}
