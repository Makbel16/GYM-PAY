import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { EmptyState } from '../../src/components/EmptyState';
import { ConfirmationDialog } from '../../src/components/ConfirmationDialog';
import { Payment } from '../../src/types';
import {
  getAllPayments,
  getPaymentsForMember,
  reversePayment,
} from '../../src/services/paymentService';
import { exportPaymentsCsv } from '../../src/services/backupService';
import { useAuth } from '../../src/context/AuthContext';

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { admin } = useAuth();
  const params = useLocalSearchParams<{ memberId?: string }>();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReverseDialog, setShowReverseDialog] = useState(false);

  const memberId = params.memberId ? Number(params.memberId) : null;

  const loadPayments = async () => {
    try {
      if (memberId) {
        const list = await getPaymentsForMember(memberId);
        setPayments(list);
      } else {
        const list = await getAllPayments(150);
        setPayments(list);
      }
    } catch (e) {
      console.error('Failed to load payments', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [memberId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const handleReverse = async () => {
    if (!selectedPayment) return;
    setShowReverseDialog(false);
    try {
      await reversePayment(
        selectedPayment.id,
        'Admin requested reversal',
        admin?.username || 'admin'
      );
      Alert.alert(t('success', 'Success'), t('paymentReversed', 'Payment reversed successfully'));
      await loadPayments();
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message || 'Failed to reverse payment');
    }
  };

  const handleExport = async () => {
    try {
      await exportPaymentsCsv();
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title={t('paymentHistoryTitle', 'Payment History')}
        subtitle={`${payments.length} Transactions`}
        showBack={true}
        dark={true}
        rightAction={
          <TouchableOpacity style={styles.exportHeaderBtn} onPress={handleExport}>
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isReversed = item.status === 'reversed';

          return (
            <TouchableOpacity
              style={[styles.paymentCard, isReversed && styles.reversedCard]}
              onPress={() =>
                router.push({
                  pathname: '/payments/receipt',
                  params: { paymentId: item.id },
                } as any)
              }
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.statusRing,
                      isReversed ? styles.statusRingReversed : styles.statusRingCompleted,
                    ]}
                  >
                    <Ionicons
                      name={isReversed ? 'close' : 'checkmark'}
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                  <View>
                    <Text style={styles.dateText}>{item.payment_date}</Text>
                    <Text style={styles.memberNameText}>
                      {item.member_name || `Member #${item.member_id}`}
                      {item.gym_id ? ` • ${item.gym_id}` : ''}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.receiptIconBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/payments/receipt',
                      params: { paymentId: item.id },
                    } as any)
                  }
                >
                  <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.planNameText}>
                    {item.plan_name || 'Membership'}
                  </Text>
                  <Text style={styles.methodText}>
                    Via {item.payment_method.toUpperCase()}
                    {item.receipt_number ? ` • #${item.receipt_number}` : ''}
                  </Text>
                </View>

                <View style={styles.amountContainer}>
                  <Text
                    style={[
                      styles.amountText,
                      isReversed && styles.amountTextReversed,
                    ]}
                  >
                    {item.amount} {t('amountEtb', 'ETB')}
                  </Text>
                  {isReversed ? (
                    <Text style={styles.reversedTag}>REVERSED</Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPayment(item);
                        setShowReverseDialog(true);
                      }}
                      style={styles.reverseLink}
                    >
                      <Text style={styles.reverseLinkText}>Reverse</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="receipt-outline"
              title={t('noRecentPayments', 'No payments recorded')}
              message="Payments recorded for members will appear here."
              actionTitle={t('recordPayment', 'Record Payment')}
              onAction={() => router.push('/payments/record' as any)}
            />
          ) : undefined
        }
      />

      <ConfirmationDialog
        visible={showReverseDialog}
        title={t('reversal', 'Reverse Payment')}
        message={t(
          'confirmReversal',
          'Are you sure you want to reverse this payment? This action is audited and will cancel the associated membership duration.'
        )}
        confirmLabel={t('reversal', 'Reverse Payment')}
        isDestructive={true}
        icon="alert-circle-outline"
        onConfirm={handleReverse}
        onCancel={() => setShowReverseDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  exportHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 36,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  reversedCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statusRingCompleted: {
    backgroundColor: colors.primary,
  },
  statusRingReversed: {
    backgroundColor: colors.statRedIcon,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  memberNameText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  receiptIconBtn: {
    padding: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  planNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  methodText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  amountTextReversed: {
    color: colors.statRedIcon,
    textDecorationLine: 'line-through',
  },
  reversedTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.statRedIcon,
    marginTop: 2,
  },
  reverseLink: {
    marginTop: 4,
  },
  reverseLinkText: {
    fontSize: 11,
    color: colors.statRedIcon,
    fontWeight: '600',
  },
});
