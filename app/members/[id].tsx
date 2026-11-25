import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { StatusBadge } from '../../src/components/StatusBadge';
import { ConfirmationDialog } from '../../src/components/ConfirmationDialog';
import { LoadingIndicator } from '../../src/components/LoadingIndicator';
import { MemberWithStatus, Payment } from '../../src/types';
import { getMemberById, toggleMemberActive } from '../../src/services/memberService';
import { getPaymentsForMember } from '../../src/services/paymentService';
import { useAuth } from '../../src/context/AuthContext';

export default function MemberDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { admin } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [member, setMember] = useState<MemberWithStatus | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const memberId = Number(id);

  const loadMemberData = async () => {
    if (!memberId) return;
    try {
      const data = await getMemberById(memberId);
      setMember(data);
      const history = await getPaymentsForMember(memberId);
      setPayments(history);
    } catch (e) {
      console.error('Failed to load member details', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMemberData();
    }, [memberId])
  );

  const handleCopyId = () => {
    if (member) {
      Clipboard.setString(member.gym_id);
      Alert.alert(t('copyId', 'Copy ID'), t('idCopied', 'ID copied to clipboard!'));
    }
  };

  const handleToggleActive = async () => {
    if (!member) return;
    setShowDeactivateDialog(false);
    try {
      const newActive = member.is_active === 0;
      await toggleMemberActive(member.id, newActive, admin?.username || 'admin');
      await loadMemberData();
      Alert.alert(
        t('success', 'Success'),
        newActive ? 'Member reactivated successfully' : 'Member deactivated successfully'
      );
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message || 'Operation failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title={t('memberDetails', 'Member Details')} showBack={true} />
        <LoadingIndicator message={t('loading', 'Loading member details...')} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.container}>
        <CustomHeader title={t('memberDetails', 'Member Details')} showBack={true} />
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.statRedIcon} />
          <Text style={styles.notFoundText}>{t('noMemberFound', 'Member not found')}</Text>
        </View>
      </View>
    );
  }

  const categoryLabel =
    member.member_type === 'student'
      ? t('dbuStudent', 'DBU Student')
      : member.member_type === 'staff'
      ? t('universityStaff', 'University Staff')
      : t('externalMember', 'External Member');

  const initials = member.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isPaid = member.status === 'active';
  const isExpired = member.status === 'expired';
  const isUnpaid = member.status === 'unpaid';

  const getRemainingDaysLabel = () => {
    if (member.status === 'inactive') {
      return t('memberIsInactive', 'Member is Deactivated');
    }
    if (isUnpaid || !member.membership_end_date) {
      return t('zeroDaysRemaining', '0 Days Remaining');
    }
    if (isExpired) {
      return t('zeroDaysExpired', '0 Days Remaining (Expired)');
    }
    if (member.days_remaining === 0) {
      return t('zeroDaysExpiresToday', '0 Days Remaining (Expires Today)');
    }
    if (member.days_remaining === 1) {
      return t('oneDayRemaining', '1 Day Remaining');
    }
    return `${member.days_remaining} Days Remaining`;
  };

  const actionButtonText =
    isExpired || isUnpaid
      ? t('activateMembership', 'Activate Membership')
      : isPaid
      ? t('renewMembership', 'Renew Membership')
      : t('recordPayment', 'Record Payment');

  return (
    <View style={styles.container}>
      <CustomHeader
        title={t('memberDetails', 'Member Details')}
        showBack={true}
        dark={true}
        rightAction={
          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={() =>
              router.push({
                pathname: '/members/edit',
                params: { id: member.id },
              } as any)
            }
          >
            <Ionicons name="pencil" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header matching Screen 4 */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatar}>
            {member.photo_uri ? (
              <Image source={{ uri: member.photo_uri }} style={styles.avatarPhoto} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <Text style={styles.memberName}>{member.full_name}</Text>
          <Text style={styles.memberCategory}>{categoryLabel}</Text>
          <View style={styles.badgeWrapper}>
            <StatusBadge status={member.status} size="large" />
          </View>

          {/* Prominent Remaining Days Highlight Banner */}
          <View
            style={[
              styles.remainingDaysBanner,
              isPaid
                ? styles.bannerActive
                : isExpired
                ? styles.bannerExpired
                : styles.bannerUnpaid,
            ]}
          >
            <Ionicons
              name={isPaid ? 'time' : isExpired ? 'alert-circle' : 'card-outline'}
              size={20}
              color={
                isPaid
                  ? colors.primary
                  : isExpired
                  ? colors.statRedIcon
                  : colors.statOrangeIcon
              }
            />
            <View style={styles.remainingBannerContent}>
              <Text style={styles.remainingBannerTitle}>
                {getRemainingDaysLabel()}
              </Text>
              <Text style={styles.remainingBannerSub}>
                {isPaid
                  ? `${t('validUntil', 'Valid until')} ${member.membership_end_date}`
                  : isExpired
                  ? `${t('expiredOn', 'Expired on')} ${member.membership_end_date}`
                  : 'Pay at bank and verify receipt to activate'}
              </Text>
            </View>
          </View>
        </View>

        {/* Member Information Details matching Screen 4 */}
        <View style={styles.detailsCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="id-card-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {member.member_type === 'student'
                  ? t('studentId', 'Student ID')
                  : t('gymId', 'Gym ID')}
              </Text>
              <Text style={styles.infoValue}>{member.gym_id}</Text>
            </View>
            <TouchableOpacity onPress={handleCopyId} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('phoneNumber', 'Phone Number')}</Text>
              <Text style={styles.infoValue}>{member.phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="fitness-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('membershipPlan', 'Membership Plan')}</Text>
              <Text style={styles.infoValue}>
                {member.current_plan_name || 'No active plan'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('expirationDate', 'Expiration Date')}</Text>
              <Text
                style={[
                  styles.infoValue,
                  member.status === 'expired' && styles.expiredText,
                ]}
              >
                {member.membership_end_date || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('registrationDate', 'Registration Date')}</Text>
              <Text style={styles.infoValue}>{member.registration_date}</Text>
            </View>
          </View>
        </View>

        {/* Payment History Section matching Screen 4 */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>{t('paymentHistory', 'Payment History')}</Text>
            {payments.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/payments/history',
                    params: { memberId: member.id },
                  } as any)
                }
                style={styles.viewAllRow}
              >
                <Text style={styles.viewAllText}>{t('viewAll', 'View All')}</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {payments.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyHistoryText}>
                {t('noPaymentHistory', 'No payments recorded yet')}
              </Text>
            </View>
          ) : (
            payments.slice(0, 3).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.paymentItem}
                onPress={() =>
                  router.push({
                    pathname: '/payments/receipt',
                    params: { paymentId: p.id },
                  } as any)
                }
              >
                <View style={styles.paymentLeft}>
                  <View style={styles.checkRing}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.paymentDate}>{p.payment_date}</Text>
                    <Text style={styles.paymentMethodText}>
                      {p.plan_name} • {p.payment_method.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>{p.amount} ETB</Text>
                  {p.status === 'reversed' && (
                    <Text style={styles.reversedBadge}>REVERSED</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bottom Action Buttons matching Screen 4 */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              router.push({
                pathname: '/members/edit',
                params: { id: member.id },
              } as any)
            }
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.editBtnText}>{t('edit', 'Edit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.recordPaymentBtn,
              (isExpired || isUnpaid) && styles.activateBtnGlow,
            ]}
            onPress={() =>
              router.push({
                pathname: '/payments/record',
                params: { memberId: member.id },
              } as any)
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name={isExpired || isUnpaid ? 'flash' : 'refresh'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.recordPaymentBtnText}>
              {actionButtonText}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Deactivate/Reactivate Button */}
        <TouchableOpacity
          style={styles.deactivateBtn}
          onPress={() => setShowDeactivateDialog(true)}
        >
          <Ionicons
            name={member.is_active === 1 ? 'pause-circle-outline' : 'play-circle-outline'}
            size={18}
            color={member.is_active === 1 ? colors.statRedIcon : colors.primary}
          />
          <Text
            style={[
              styles.deactivateBtnText,
              { color: member.is_active === 1 ? colors.statRedIcon : colors.primary },
            ]}
          >
            {member.is_active === 1
              ? t('deactivateMember', 'Deactivate Member')
              : t('activateMember', 'Activate Member')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={showDeactivateDialog}
        title={
          member.is_active === 1
            ? t('deactivateMember', 'Deactivate Member')
            : t('activateMember', 'Activate Member')
        }
        message={
          member.is_active === 1
            ? t('confirmDeactivate', 'Are you sure you want to deactivate this member?')
            : t('confirmActivate', 'Are you sure you want to reactivate this member?')
        }
        confirmLabel={t('confirm', 'Confirm')}
        isDestructive={member.is_active === 1}
        onConfirm={handleToggleActive}
        onCancel={() => setShowDeactivateDialog(false)}
      />
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
  editHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarPhoto: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  memberName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  memberCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  badgeWrapper: {
    marginTop: 12,
  },
  remainingDaysBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1.2,
  },
  bannerActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  bannerExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  bannerUnpaid: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  remainingBannerContent: {
    marginLeft: 10,
    flex: 1,
  },
  remainingBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  remainingBannerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  activateBtnGlow: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryUltralight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  expiredText: {
    color: colors.statRedIcon,
  },
  copyBtn: {
    padding: 8,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginRight: 4,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  paymentDate: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentMethodText: {
    fontSize: 11,
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
  reversedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.statRedIcon,
    marginTop: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 6,
  },
  recordPaymentBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  recordPaymentBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  deactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  deactivateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
