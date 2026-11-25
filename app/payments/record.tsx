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
import { getAllMembers } from '../../src/services/memberService';
import {
  calculateRenewalDates,
  getMembershipPlans,
  getTodayString,
  addDaysToDate,
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [paymentDate, setPaymentDate] = useState(getTodayString());
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState('');
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

        let currentM: MemberWithStatus | null = null;
        if (params.memberId) {
          const m = allMembers.find((item) => item.id === Number(params.memberId));
          if (m) {
            currentM = m;
            setSelectedMember(m);
          }
        }

        const allPlans = await getMembershipPlans();
        setPlans(allPlans);

        if (allPlans.length > 0) {
          const firstPlan = allPlans[0];
          setSelectedPlan(firstPlan);
          setAmount(String(firstPlan.price));

          // Set initial start and end dates
          const calc = calculateRenewalDates(
            currentM?.membership_end_date ?? null,
            firstPlan.duration_days,
            getTodayString()
          );
          setStartDate(calc.startDate);
          setEndDate(calc.endDate);
        }
      } catch (e) {
        console.error('Initialization error', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [params.memberId]);

  // When selected plan changes, update amount and dates
  const handleSelectPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setAmount(String(plan.price));

    const calc = calculateRenewalDates(
      selectedMember?.membership_end_date ?? null,
      plan.duration_days,
      paymentDate
    );
    setStartDate(calc.startDate);
    setEndDate(calc.endDate);
  };

  // When payment date or member changes, re-calculate default dates
  const handlePaymentDateChange = (newDate: string) => {
    setPaymentDate(newDate);
    if (selectedPlan) {
      const calc = calculateRenewalDates(
        selectedMember?.membership_end_date ?? null,
        selectedPlan.duration_days,
        newDate
      );
      setStartDate(calc.startDate);
      setEndDate(calc.endDate);
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (selectedPlan && newStart.length === 10) {
      setEndDate(addDaysToDate(newStart, selectedPlan.duration_days));
    }
  };

  const isActivation =
    selectedMember?.status === 'expired' ||
    selectedMember?.status === 'unpaid' ||
    !selectedMember?.membership_end_date;

  // Calculate live remaining days from today until proposed end date
  const calculateLiveRemainingDays = (): number => {
    if (!endDate || endDate.length !== 10) return 0;
    try {
      const today = getTodayString();
      const [tY, tM, tD] = today.split('-').map(Number);
      const [eY, eM, eD] = endDate.split('-').map(Number);
      const tTime = new Date(tY, tM - 1, tD).getTime();
      const eTime = new Date(eY, eM - 1, eD).getTime();
      const diff = Math.ceil((eTime - tTime) / (1000 * 60 * 60 * 24));
      return Math.max(0, isNaN(diff) ? 0 : diff);
    } catch {
      return 0;
    }
  };

  const liveRemainingDays = calculateLiveRemainingDays();

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

    if (!startDate || startDate.length !== 10) {
      setError('Please enter a valid start date (YYYY-MM-DD)');
      return;
    }

    if (!endDate || endDate.length !== 10) {
      setError('Please enter a valid expiration date (YYYY-MM-DD)');
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
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        recordedBy: admin?.username || 'admin',
      });

      const successTitle = isActivation
        ? t('activateMember', 'Membership Activated!')
        : t('success', 'Renewal Confirmed!');

      Alert.alert(
        successTitle,
        `${isActivation ? 'Membership successfully activated!' : t('paymentSuccess', 'Payment recorded successfully!')}\n\n` +
          `${t('membershipStartDate', 'Membership Start Date')}: ${startDate}\n` +
          `${t('newExpirationDate', 'New Expiration Date')}: ${result.newEndDate}\n` +
          `${t('calculatedRemaining', 'Calculated Remaining Days')}: ${liveRemainingDays} Days\n` +
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
        <CustomHeader
          title={isActivation ? t('activateMembership', 'Activate Membership') : t('renewMembership', 'Renew Membership')}
          showBack={true}
        />
        <LoadingIndicator message={t('loading', 'Loading payment details...')} />
      </View>
    );
  }

  const paymentMethods: { key: PaymentMethod; label: string; icon: any }[] = [
    { key: 'bank', label: t('bank', 'Bank Transfer'), icon: 'business-outline' },
    { key: 'telebirr', label: t('telebirr', 'Telebirr'), icon: 'phone-portrait-outline' },
    { key: 'cash', label: t('cash', 'Cash'), icon: 'cash-outline' },
    { key: 'other', label: t('otherMethod', 'Other'), icon: 'ellipsis-horizontal-circle-outline' },
  ];

  const pageTitle = isActivation
    ? t('activateMembership', 'Activate Membership')
    : t('renewMembership', 'Renew Membership');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CustomHeader
        title={pageTitle}
        subtitle={isActivation ? 'Verify Bank Receipt & Activate' : 'Extend Membership'}
        showBack={true}
        dark={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selected Member Header Card */}
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
              <View style={styles.statusRow}>
                <StatusBadge status={selectedMember.status} size="small" />
                <Text style={styles.currentRemainingText}>
                  {selectedMember.status === 'active'
                    ? `${selectedMember.days_remaining} Days Left`
                    : '0 Days Remaining'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedMember(null)}
              style={styles.changeMemberBtn}
            >
              <Text style={styles.changeMemberText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.selectMemberCard}>
            <Text style={styles.cardSectionLabel}>Select Member to Activate / Renew</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberPicker}>
              {members.map((m: MemberWithStatus) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.memberPickItem}
                  onPress={() => {
                    setSelectedMember(m);
                    if (selectedPlan) {
                      const calc = calculateRenewalDates(
                        m.membership_end_date ?? null,
                        selectedPlan.duration_days,
                        paymentDate
                      );
                      setStartDate(calc.startDate);
                      setEndDate(calc.endDate);
                    }
                  }}
                >
                  <Text style={styles.memberPickName}>{m.full_name}</Text>
                  <Text style={styles.memberPickId}>{m.gym_id}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Error Banner */}
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

          {/* Bank Receipt Verification Section */}
          <View style={styles.receiptSectionBox}>
            <View style={styles.receiptHeaderRow}>
              <Ionicons name="receipt-outline" size={18} color={colors.primary} />
              <Text style={styles.receiptSectionTitle}>
                {t('bankReceiptVerification', 'Bank Receipt Verification')}
              </Text>
            </View>
            <Text style={styles.receiptHintText}>
              {t('bankReceiptHint', 'Verify the member bank deposit receipt before activation')}
            </Text>

            <InputField
              label={t('bankReceiptNumber', 'Bank Receipt Number')}
              value={receiptNumber}
              onChangeText={setReceiptNumber}
              placeholder={t('bankReceiptPlaceholder', 'e.g. CBE-TX-9843217')}
              icon="document-text-outline"
            />
          </View>

          {/* Payment Date */}
          <InputField
            label={t('paymentDate', 'Payment Date')}
            value={paymentDate}
            onChangeText={handlePaymentDateChange}
            placeholder="YYYY-MM-DD"
            icon="calendar-outline"
            required
          />

          {/* Set Membership Dates (Rule 7) */}
          <View style={styles.dateConfigSection}>
            <Text style={styles.dateConfigHeader}>
              <Ionicons name="calendar" size={16} color={colors.primary} />{' '}
              {t('membershipDates', 'Membership Dates')}
            </Text>
            <View style={styles.dateInputsRow}>
              <View style={styles.dateInputCol}>
                <InputField
                  label={t('membershipStartDate', 'Membership Start Date')}
                  value={startDate}
                  onChangeText={handleStartDateChange}
                  placeholder="YYYY-MM-DD"
                  icon="play-outline"
                  required
                />
              </View>
              <View style={styles.dateInputCol}>
                <InputField
                  label={t('membershipEndDate', 'Membership Expiration Date')}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  icon="flag-outline"
                  required
                />
              </View>
            </View>
          </View>

          {/* Notes (Optional) */}
          <InputField
            label={t('notes', 'Notes (Optional)')}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional comments or bank teller branch"
            icon="chatbox-outline"
          />

          {/* Live Calculated Remaining Days Banner */}
          <View style={styles.liveCalculationCard}>
            <View style={styles.liveIconRing}>
              <Ionicons name="time" size={24} color={colors.primary} />
            </View>
            <View style={styles.liveCalcContent}>
              <Text style={styles.liveCalcTitle}>
                {t('calculatedRemaining', 'Calculated Remaining Days')}
              </Text>
              <Text style={styles.liveCalcMain}>{liveRemainingDays} Days Remaining</Text>
              <Text style={styles.liveCalcSub}>
                Valid from {startDate} to {endDate}
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <PrimaryButton
            title={
              isActivation
                ? t('confirmAndActivate', 'Confirm & Activate Membership')
                : t('confirmAndRenew', 'Confirm & Renew Membership')
            }
            onPress={handleConfirmPayment}
            icon={isActivation ? 'flash' : 'checkmark-circle'}
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  currentRemainingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  changeMemberBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
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
  receiptSectionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  receiptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  receiptSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  receiptHintText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  dateConfigSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  dateConfigHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  dateInputsRow: {
    gap: 10,
  },
  dateInputCol: {
    flex: 1,
  },
  liveCalculationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    marginBottom: 20,
  },
  liveIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveCalcContent: {
    flex: 1,
  },
  liveCalcTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveCalcMain: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: 2,
  },
  liveCalcSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  submitBtn: {
    marginTop: 4,
  },
});
