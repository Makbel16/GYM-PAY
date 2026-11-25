import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import {
  GymScreenContainer,
  HeaderActionPill,
  HeaderIconCircle,
} from '../../src/components/CustomHeader';
import { StatCard } from '../../src/components/StatCard';
import { AdminAvatar } from '../../src/components/AdminAvatar';
import { DashboardStats } from '../../src/types';
import { getDashboardStats } from '../../src/services/reportService';
import { useAuth } from '../../src/context/AuthContext';

function MonthlyIncomeMiniIcon() {
  return (
    <Svg width={34} height={34} viewBox="0 0 34 34">
      {/* Stepped ascending bars */}
      <Rect x="4" y="21" width="4.5" height="9" rx="1.5" fill="#16A34A" />
      <Rect x="11" y="17" width="4.5" height="13" rx="1.5" fill="#16A34A" />
      <Rect x="18" y="13" width="4.5" height="17" rx="1.5" fill="#16A34A" />
      <Rect x="25" y="9" width="4.5" height="21" rx="1.5" fill="#16A34A" />
      {/* Upward trend line & arrowhead */}
      <Path
        d="M3 16L13 10.5L19 12.5L29 4"
        stroke="#058C42"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M24 3.5H29.5V9"
        stroke="#058C42"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function SteppedGrowthChart() {
  return (
    <Svg width={86} height={54} viewBox="0 0 86 54">
      <Defs>
        <SvgLinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#22C55E" />
          <Stop offset="100%" stopColor="#057A39" />
        </SvgLinearGradient>
      </Defs>
      {/* Ascending bars */}
      <Rect x="4" y="39" width="11" height="13" rx="2.5" fill="#86EFAC" />
      <Rect x="21" y="31" width="11" height="21" rx="2.5" fill="#4ADE80" />
      <Rect x="38" y="23" width="11" height="29" rx="2.5" fill="url(#barGrad)" />
      <Rect x="55" y="15" width="11" height="37" rx="2.5" fill="url(#barGrad)" />
      <Rect x="72" y="7" width="11" height="45" rx="2.5" fill="#046A38" />
      {/* Upward arrow tip at top of tallest bar */}
      <Path
        d="M71 8.5L77.5 1.5L84 8.5"
        stroke="#046A38"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { admin } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    total_members: 0,
    active_members: 0,
    expired_members: 0,
    unpaid_members: 0,
    today_income: 0,
    monthly_income: 0,
    monthly_growth_percent: null,
    recent_payments: [],
  });

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load dashboard stats', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleQuickSearch = () => {
    Keyboard.dismiss();
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(tabs)/payments',
        params: { initialQuery: searchQuery.trim() },
      } as any);
    } else {
      router.push('/(tabs)/payments' as any);
    }
  };

  const adminDisplayName = admin?.full_name || 'Dawit Belete';

  const growthText =
    stats.monthly_growth_percent !== null && stats.monthly_growth_percent !== undefined
      ? `${stats.monthly_growth_percent >= 0 ? '↑ +' : '↓ '}${stats.monthly_growth_percent}%`
      : `↑ ${t('thisMonth', 'This Month')}`;

  return (
    <GymScreenContainer
      title={t('dashboardTitle', 'Dashboard')}
      subtitle={`${t('appName', 'DBU Gym')} • ${t('appSubtitle', 'Payment Tracker')}`}
      icon="barbell"
      rightAction={
        <>
          <HeaderIconCircle
            icon="notifications"
            onPress={() => router.push('/payments/history' as any)}
          />
          <HeaderActionPill
            label={t('payShort', 'Pay')}
            icon="add"
            onPress={() => router.push('/payments/record' as any)}
          />
        </>
      }
    >
      <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#059669"
            />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Back Row: Circular Avatar left + Soft Pill Card right */}
          <View style={styles.welcomeRow}>
            <AdminAvatar size={72} />
            <View style={styles.welcomePillCard}>
              <Text style={styles.welcomeGreeting}>
                {t('welcomeBack', 'Welcome Back!')}
              </Text>
              <Text style={styles.welcomeAdminName} numberOfLines={1}>
                {adminDisplayName}
              </Text>
              <Text style={styles.welcomeRole}>
                {t('gymAdministrator', 'Gym Administrator')}
              </Text>
            </View>
          </View>

          {/* 2x2 Stat Cards Grid matching reference image */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                title={t('totalMembers', 'Total Members')}
                value={stats.total_members}
                variant="green"
                onPress={() => router.push('/(tabs)/members' as any)}
              />
              <StatCard
                title={t('activeMembers', 'Active Members')}
                value={stats.active_members}
                variant="blue"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/members',
                    params: { filterStatus: 'active' },
                  } as any)
                }
              />
            </View>

            <View style={styles.statsRow}>
              <StatCard
                title={t('expired', 'Expired')}
                value={stats.expired_members}
                variant="orange"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/members',
                    params: { filterStatus: 'expired' },
                  } as any)
                }
              />
              <StatCard
                title={t('unpaid', 'Unpaid')}
                value={stats.unpaid_members}
                variant="red"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/members',
                    params: { filterStatus: 'unpaid' },
                  } as any)
                }
              />
            </View>
          </View>

          {/* Monthly Income Banner Card matching reference image */}
          <TouchableOpacity
            style={styles.monthlyIncomeCard}
            onPress={() => router.push('/reports' as any)}
            activeOpacity={0.88}
          >
            <View style={styles.incomeLeftIcon}>
              <MonthlyIncomeMiniIcon />
            </View>

            <View style={styles.incomeCenterText}>
              <Text style={styles.monthlyIncomeLabel}>
                {t('monthlyIncome', 'Monthly Income')}
              </Text>
              <Text style={styles.monthlyIncomeValue}>
                {stats.monthly_income.toLocaleString()} {t('amountEtb', 'ETB')}
              </Text>
              <View style={styles.trendRow}>
                <Text
                  style={[
                    styles.trendGreenText,
                    stats.monthly_growth_percent !== null &&
                    stats.monthly_growth_percent !== undefined &&
                    stats.monthly_growth_percent < 0
                      ? styles.trendNegativeText
                      : null,
                  ]}
                >
                  {growthText}
                </Text>
              </View>
            </View>

            <SteppedGrowthChart />
          </TouchableOpacity>

          {/* Quick Member Search Section matching reference image */}
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>
              {t('quickMemberSearch', 'Quick Member Search')}
            </Text>

            <View style={styles.searchInputBox}>
              <Ionicons name="search" size={20} color="#0F172A" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInputText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleQuickSearch}
                placeholder={t('quickSearchPlaceholder', 'Student ID, Gym ID or phone number')}
                placeholderTextColor="#64748B"
                returnKeyType="search"
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={handleQuickSearch}
              activeOpacity={0.85}
              style={styles.searchButtonWrapper}
            >
              <LinearGradient
                colors={['#0A8040', '#035C2B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchButton}
              >
                <Text style={styles.searchButtonText}>{t('searchButton', 'Search')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick Actions Header with Divider matching reference image */}
          <View style={styles.actionsDividerHeader}>
            <Text style={styles.actionsTitleText}>
              {t('quickActions', 'Quick Actions')}
            </Text>
            <View style={styles.dividerLine} />
            <Text style={styles.plusSymbol}>+</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 3 Pale-Tint Quick Action Cards in a row matching reference image */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/members/register' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={24} color="#058C42" style={styles.actionCardIcon} />
              <Text style={styles.actionCardTitle} numberOfLines={2}>
                {t('quickRegister', 'Register\nMember').replace(' ', '\n')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/payments/record' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet" size={24} color="#058C42" style={styles.actionCardIcon} />
              <Text style={styles.actionCardTitle} numberOfLines={2}>
                {t('quickPayment', 'Record\nPayment').replace(' ', '\n')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/reports' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="stats-chart" size={24} color="#065F46" style={styles.actionCardIcon} />
              <Text style={styles.actionCardTitle} numberOfLines={2}>
                {t('viewReports', 'View\nReports').replace(' ', '\n')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
    </GymScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  welcomePillCard: {
    flex: 1,
    marginLeft: 14,
    backgroundColor: '#F3F6FA',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E9EEF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  welcomeGreeting: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  welcomeAdminName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
    letterSpacing: -0.2,
  },
  welcomeRole: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 2,
  },
  statsGrid: {
    marginHorizontal: 11,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
  },
  monthlyIncomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F7ED',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  incomeLeftIcon: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeCenterText: {
    flex: 1,
  },
  monthlyIncomeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  monthlyIncomeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  trendRow: {
    alignItems: 'flex-end',
    paddingRight: 8,
    marginTop: 2,
  },
  trendGreenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  trendNegativeText: {
    color: '#DC2626',
  },
  searchSection: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#DCE3EC',
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputText: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
  },
  searchButtonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#046A38',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  searchButton: {
    height: 44,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  actionsDividerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  actionsTitleText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  plusSymbol: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    paddingHorizontal: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F1F6FA',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6EEF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  actionCardIcon: {
    marginBottom: 6,
  },
  actionCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 16,
  },
});
