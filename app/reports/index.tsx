import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { DonutChart } from '../../src/components/DonutChart';
import { ReportSummary } from '../../src/types';
import { getReportSummary } from '../../src/services/reportService';
import { exportFinancialReportCsv } from '../../src/services/backupService';

export default function ReportsScreen() {
  const { t } = useTranslation();

  const [period, setPeriod] = useState<'month' | 'last_month' | 'year' | 'all'>('month');
  const [report, setReport] = useState<ReportSummary>({
    period: 'month',
    total_income: 0,
    payment_count: 0,
    active_count: 0,
    expired_count: 0,
    unpaid_count: 0,
    student_count: 0,
    staff_count: 0,
    external_count: 0,
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadReport = async () => {
    try {
      const data = await getReportSummary(period);
      setReport(data);
    } catch (e) {
      console.error('Failed to load report summary', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [period])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await exportFinancialReportCsv(period);
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const periods: { key: 'month' | 'last_month' | 'year' | 'all'; label: string }[] = [
    { key: 'month', label: t('thisMonth', 'This Month') },
    { key: 'last_month', label: t('lastMonth', 'Last Month') },
    { key: 'year', label: t('thisYear', 'This Year') },
    { key: 'all', label: t('allTime', 'All Time') },
  ];

  return (
    <View style={styles.container}>
      <CustomHeader title={t('reportsTitle', 'Reports')} showBack={true} dark={true} />

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
        {/* Time Period Selector Pills matching Screen 8 */}
        <View style={styles.periodRow}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodPill, period === p.key && styles.periodPillActive]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.periodPillText,
                  period === p.key && styles.periodPillTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Income Summary Card matching Screen 8 */}
        <View style={styles.incomeCard}>
          <View style={styles.incomeHeader}>
            <View style={styles.cashIconWrapper}>
              <Ionicons name="cash" size={28} color={colors.primary} />
            </View>
            <View style={styles.incomeTextWrapper}>
              <Text style={styles.incomeLabel}>{t('totalIncome', 'Total Income')}</Text>
              <Text style={styles.incomeValue}>
                {report.total_income.toLocaleString()} {t('amountEtb', 'ETB')}
              </Text>
            </View>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={16} color={colors.primary} />
              <Text style={styles.trendText}>+8%</Text>
            </View>
          </View>

          <View style={styles.incomeFooter}>
            <Text style={styles.transactionCountText}>
              Based on {report.payment_count} completed payments
            </Text>
          </View>
        </View>

        {/* Member Status Donut Chart Section matching Screen 8 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('memberStatus', 'Member Status')}</Text>
          <DonutChart
            activeCount={report.active_count}
            expiredCount={report.expired_count}
            unpaidCount={report.unpaid_count}
          />
        </View>

        {/* Member Categories Distribution */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('categoryDistribution', 'Category Breakdown')}
          </Text>

          <View style={styles.categoryRow}>
            <View style={styles.categoryItem}>
              <View style={[styles.categoryIconRing, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="school" size={20} color="#2563EB" />
              </View>
              <Text style={styles.categoryNumber}>{report.student_count}</Text>
              <Text style={styles.categoryLabel}>{t('student', 'Students')}</Text>
            </View>

            <View style={styles.categoryItem}>
              <View style={[styles.categoryIconRing, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="briefcase" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.categoryNumber}>{report.staff_count}</Text>
              <Text style={styles.categoryLabel}>{t('staff', 'Staff')}</Text>
            </View>

            <View style={styles.categoryItem}>
              <View style={[styles.categoryIconRing, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="people" size={20} color="#15803D" />
              </View>
              <Text style={styles.categoryNumber}>{report.external_count}</Text>
              <Text style={styles.categoryLabel}>{t('external', 'External')}</Text>
            </View>
          </View>
        </View>

        {/* CSV Export Button */}
        <TouchableOpacity
          style={styles.exportCsvBtn}
          onPress={handleExportCsv}
          disabled={exporting}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
          <Text style={styles.exportCsvBtnText}>
            {exporting ? t('loading', 'Exporting...') : `${t('exportCsv', 'Export CSV')} (${period.toUpperCase()})`}
          </Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  periodPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
  },
  periodPillActive: {
    backgroundColor: colors.primary,
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  incomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  incomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cashIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryUltralight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  incomeTextWrapper: {
    flex: 1,
  },
  incomeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  incomeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryUltralight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  incomeFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  transactionCountText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  exportCsvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  exportCsvBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
