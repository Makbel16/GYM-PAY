import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { StatCard } from '../../src/components/StatCard';
import { SearchBar } from '../../src/components/SearchBar';
import { DashboardStats } from '../../src/types';
import { getDashboardStats } from '../../src/services/reportService';
import { getTodayString } from '../../src/services/membershipService';

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [stats, setStats] = useState<DashboardStats>({
    total_members: 0,
    active_members: 0,
    expired_members: 0,
    unpaid_members: 0,
    today_income: 0,
    monthly_income: 0,
    recent_payments: [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard statistics', error);
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
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(tabs)/payments',
        params: { initialQuery: searchQuery.trim() },
      } as any);
    } else {
      router.push('/(tabs)/payments' as any);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title={t('appName', 'DBU Gym')}
        subtitle={t('appSubtitle', 'Payment Tracker')}
        dark={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Title & Subtitle matching Screen 2 */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>{t('dashboardTitle', 'Dashboard')}</Text>
          <Text style={styles.pageSubtitle}>
            {t('dashboardSubtitle', 'Overview of Gym Members')}
          </Text>
        </View>

        {/* 2x2 Stat Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title={t('totalMembers', 'Total Members')}
              value={stats.total_members}
              icon="people"
              variant="green"
              onPress={() => router.push('/(tabs)/members' as any)}
            />
            <StatCard
              title={t('activeMembers', 'Active Members')}
              value={stats.active_members}
              icon="checkmark-circle"
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
              icon="time"
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
              icon="alert-circle"
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

        {/* Today's Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{t('todaysSummary', "Today's Summary")}</Text>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.dateText}>{formatDateDisplay(getTodayString())}</Text>
            </View>
          </View>

          <View style={styles.incomeRow}>
            <View style={styles.cashIconWrapper}>
              <Ionicons name="cash" size={28} color={colors.primary} />
            </View>
            <View style={styles.incomeTextWrapper}>
              <Text style={styles.incomeAmount}>
                {stats.today_income.toLocaleString()} {t('amountEtb', 'ETB')}
              </Text>
              <Text style={styles.incomeLabel}>{t('todaysIncome', "Today's Income")}</Text>
            </View>

            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={16} color={colors.primary} />
              <Text style={styles.trendText}>Live</Text>
            </View>
          </View>
        </View>

        {/* Quick Search Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>{t('quickSearch', 'Quick Search')}</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSearch={handleQuickSearch}
            placeholder={t('quickSearchPlaceholder', 'Student ID, Gym ID or phone number')}
          />
        </View>

        {/* Action Shortcuts */}
        <View style={styles.actionShortcuts}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/members/register' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconRing, { backgroundColor: colors.primaryUltralight }]}>
              <Ionicons name="person-add" size={20} color={colors.primary} />
            </View>
            <Text style={styles.actionBtnText}>{t('quickRegister', 'Register Member')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/payments/record' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconRing, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="card" size={20} color="#2563EB" />
            </View>
            <Text style={styles.actionBtnText}>{t('quickPayment', 'Record Payment')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/reports' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconRing, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="bar-chart" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.actionBtnText}>{t('reports', 'Reports')}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Payments Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionHeaderTitle}>
              {t('recentPayments', 'Recent Payments')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/payments/history' as any)}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>{t('viewAll', 'View All')}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {stats.recent_payments.length === 0 ? (
            <View style={styles.emptyRecent}>
              <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyRecentText}>
                {t('noRecentPayments', 'No recent payments found')}
              </Text>
            </View>
          ) : (
            stats.recent_payments.map((payment) => (
              <TouchableOpacity
                key={payment.id}
                style={styles.paymentItem}
                onPress={() =>
                  router.push({
                    pathname: '/payments/receipt',
                    params: { paymentId: payment.id },
                  } as any)
                }
                activeOpacity={0.7}
              >
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentCheckRing}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={styles.paymentMemberName}>
                      {payment.member_name || `Member #${payment.member_id}`}
                    </Text>
                    <Text style={styles.paymentSubtext}>
                      {payment.gym_id} • {payment.payment_method.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>
                    {payment.amount} {t('amountEtb', 'ETB')}
                  </Text>
                  <Text style={styles.paymentDate}>{payment.payment_date}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  titleSection: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cashIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryUltralight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  incomeTextWrapper: {
    flex: 1,
  },
  incomeAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  incomeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryUltralight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  trendText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  actionShortcuts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  recentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginRight: 4,
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyRecentText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentCheckRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentMemberName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
