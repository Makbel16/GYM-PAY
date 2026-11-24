import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { InputField } from '../../src/components/InputField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { LoadingIndicator } from '../../src/components/LoadingIndicator';
import { StatusBadge } from '../../src/components/StatusBadge';
import { MemberWithStatus, MembershipPlan, PaymentMethod } from '../../src/types';
import { getMemberById, getAllMembers } from '../../src/services/memberService';
import {
  calculateRenewalDates,
  getMembershipPlans,
  getTodayString,
} from '../../src/services/membershipService';
import { recordPayment } from '../../src/services/paymentService';
import { useAuth } from '../../src/context/AuthContext';

export default function RecordPaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { admin } = useAuth();
  const params = useLocalSearchParams<{ memberId?: string }>();

  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberWithStatus | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState(getTodayString());
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load member and plans
  useEffect(() => {
    async function init() {
      try {
        const allMembers = await getAllMembers();
        setMembers(allMembers);

        if (params.memberId) {
          const m = allMembers.find((item) => item.id === Number(params.memberId));
          if (m) setSelectedMember(m);
        }

        const allPlans = await getMembershipPlans();
        setPlans(allPlans);

        if (allPlans.length > 0) {
          setSelectedPlan(allPlans[0]);
          setAmount(String(allPlans[0].price));
        }
      } catch (e) {
        console.error('Initialization error', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [params.memberId]);

  // When selected plan changes, update amount
  const handleSelectPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setAmount(String(plan.price));
  };

  // Calculate projected new expiration date
  const projected = selectedPlan
    ? calculateRenewalDates(
        selectedMember?.membership_end_date ?? null,
        selectedPlan.duration_days,
        paymentDate
      )
    : null;

  const handleConfirmPayment = async () => {
    if (!selectedMember) {
      setError('Please select a gym member');
      return;
    }

    if (!selectedPlan) {
      setError('Please select a membership plan');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await recordPayment({
        memberId: selectedMember.id,
        planId: selectedPlan.id,
        amount: numericAmount,
        paymentMethod,
        paymentDate,
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        recordedBy: admin?.username || 'admin',
      });

      Alert.alert(
        t('success', 'Success'),
        `${t('paymentSuccess', 'Payment recorded successfully!')}\n` +
          `${t('newExpirationDate', 'New Expiration Date')}: ${result.newEndDate}\n` +
          `(${result.isExtended ? t('renewalExtended', 'Continuous renewal extended') : t('renewalStarted', 'New period started')})`,
        [
          {
            text: t('printReceipt', 'View Receipt'),
            onPress: () =>
              router.replace({
                pathname: '/payments/receipt',
                params: { paymentId: result.paymentId },
              } as any),
          },
          {
            text: t('viewDetails', 'Member Details'),
            onPress: () => router.replace(`/members/${selectedMember.id}` as any),
          },
        ]
      );
    } catch (e: any) {
      setError(e.message || 'Payment recording failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title={t('recordPaymentTitle', 'Record Payment')} showBack={true} />
        <LoadingIndicator message={t('loading', 'Loading payment details...')} />
      </View>
    );
  }

  const paymentMethods: { key: PaymentMethod; label: string; icon: any }[] = [
    { key: 'cash', label: t('cash', 'Cash'), icon: 'cash-outline' },
    { key: 'telebirr', label: t('telebirr', 'Telebirr'), icon: 'phone-portrait-outline' },
    { key: 'bank', label: t('bank', 'Bank Transfer'), icon: 'business-outline' },
    { key: 'other', label: t('otherMethod', 'Other'), icon: 'ellipsis-horizontal-circle-outline' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CustomHeader
        title={t('recordPaymentTitle', 'Record Payment')}
        showBack={true}
        dark={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selected Member Header Card matching Screen 6 */}
        {selectedMember ? (
          <View style={styles.memberSummaryCard}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {selectedMember.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{selectedMember.full_name}</Text>
              <Text style={styles.memberGymId}>{selectedMember.gym_id}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedMember(null)}
              style={styles.changeMemberBtn}
            >
              <Text style={styles.changeMemberText}>Change</Text>
            </TouchableOpacity>
            <StatusBadge status={selectedMember.status} size="small" />
          </View>
        ) : (
          <View style={styles.selectMemberCard}>
            <Text style={styles.cardSectionLabel}>Select Member to Pay</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberPicker}>
              {members.map((m: MemberWithStatus) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.memberPickItem}
                  onPress={() => setSelectedMember(m)}
                >
                  <Text style={styles.memberPickName}>{m.full_name}</Text>
                  <Text style={styles.memberPickId}>{m.gym_id}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.statRedIcon} />
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          {/* Membership Plan Selection */}
          <Text style={styles.formSectionLabel}>{t('selectPlan', 'Select Membership Plan')} *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.planPicker}
          >
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan?.id === plan.id && styles.planCardActive,
                ]}
                onPress={() => handleSelectPlan(plan)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.planName,
                    selectedPlan?.id === plan.id && styles.planNameActive,
                  ]}
                >
                  {plan.plan_name}
                </Text>
                <Text style={styles.planDuration}>{plan.duration_days} Days</Text>
                <Text
                  style={[
                    styles.planPrice,
                    selectedPlan?.id === plan.id && styles.planPriceActive,
                  ]}
                >
                  {plan.price} ETB
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Payment Amount */}
          <InputField
            label={t('paymentAmount', 'Payment Amount')}
            value={amount}
            onChangeText={setAmount}
            placeholder="500"
            keyboardType="numeric"
            icon="cash-outline"
            required
            rightAction={<Text style={styles.currencyBadge}>ETB</Text>}
          />

          {/* Payment Method Selector */}
          <Text style={styles.formSectionLabel}>{t('paymentMethod', 'Payment Method')} *</Text>
          <View style={styles.paymentMethodGrid}>
            {paymentMethods.map((pm) => (
              <TouchableOpacity
                key={pm.key}
                style={[
                  styles.paymentMethodPill,
                  paymentMethod === pm.key && styles.paymentMethodPillActive,
                ]}
                onPress={() => setPaymentMethod(pm.key)}
              >
                <Ionicons
                  name={pm.icon}
                  size={16}
                  color={paymentMethod === pm.key ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === pm.key && styles.paymentMethodTextActive,
                  ]}
                >
                  {pm.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Payment Date */}
          <InputField
            label={t('paymentDate', 'Payment Date')}
            value={paymentDate}
            onChangeText={setPaymentDate}
            placeholder="YYYY-MM-DD"
            icon="calendar-outline"
            required
          />

          {/* Receipt Number (Optional) */}
          <InputField
            label={t('receiptNumber', 'Receipt Number (Optional)')}
            value={receiptNumber}
            onChangeText={setReceiptNumber}
            placeholder="e.g. REC-2026-001"
            icon="receipt-outline"
          />

          {/* Notes (Optional) */}
          <InputField
            label={t('notes', 'Notes (Optional)')}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional comments or payment reference"
            icon="document-text-outline"
          />

          {/* Calculated New Expiration Date Banner matching Screen 6 */}
          {projected && (
            <View style={styles.previewBox}>
              <View style={styles.previewIconRing}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewLabel}>
                  {t('newExpirationDate', 'New Expiration Date')}
                </Text>
                <Text style={styles.previewValue}>{projected.endDate}</Text>
                <Text style={styles.previewSubtext}>
                  {projected.isExtended
                    ? t('renewalExtended', 'Continuous renewal from current expiry')
                    : t('renewalStarted', 'New period from payment date')}
                </Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <PrimaryButton
            title={t('confirmPayment', 'Confirm Payment')}
            onPress={handleConfirmPayment}
            icon="checkmark-circle"
            loading={saving}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  memberSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  memberGymId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  changeMemberBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  changeMemberText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  selectMemberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  memberPicker: {
    flexDirection: 'row',
  },
  memberPickItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  memberPickItemActive: {
    backgroundColor: colors.primaryUltralight,
    borderColor: colors.primary,
  },
  memberPickName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  memberPickId: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBoxText: {
    color: colors.statRedIcon,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  planPicker: {
    paddingBottom: 14,
    gap: 10,
  },
  planCard: {
    width: 140,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  planCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryUltralight,
  },
  planName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  planNameActive: {
    color: colors.primary,
  },
  planDuration: {
    fontSize: 11,
    color: colors.textSecondary,
    marginVertical: 4,
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  planPriceActive: {
    color: colors.primary,
  },
  currencyBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    paddingHorizontal: 4,
  },
  paymentMethodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '47%',
  },
  paymentMethodPillActive: {
    backgroundColor: colors.primaryUltralight,
    borderColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  paymentMethodTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryUltralight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 20,
  },
  previewIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  previewSubtext: {
    fontSize: 11,
    color: colors.primaryDark,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 8,
  },
});
