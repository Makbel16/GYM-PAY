import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { MemberWithStatus } from '../types';
import { colors } from '../theme/colors';

interface MemberCardProps {
  member: MemberWithStatus;
  detailed?: boolean;
  onPress?: () => void;
  onRecordPayment?: () => void;
}

const AVATAR_GRADIENTS: readonly [string, string][] = [
  ['#22C55E', '#14B8A6'], // Emerald -> Teal
  ['#7C3AED', '#4F46E5'], // Violet -> Indigo
  ['#FB923C', '#EA580C'], // Orange -> Deep Orange
  ['#3B82F6', '#1D4ED8'], // Blue -> Royal Blue
  ['#EC4899', '#DB2777'], // Pink -> Rose
];

export function MemberCard({
  member,
  detailed = false,
  onPress,
  onRecordPayment,
}: MemberCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/members/${member.id}` as any);
    }
  };

  const handlePayPress = () => {
    if (onRecordPayment) {
      onRecordPayment();
    } else {
      router.push({
        pathname: '/payments/record',
        params: { memberId: member.id },
      } as any);
    }
  };

  const categoryLabel =
    member.member_type === 'student'
      ? t('dbuStudent', 'DBU Student')
      : member.member_type === 'staff'
      ? t('universityStaff', 'University Staff')
      : t('externalMember', 'External Member');

  const firstInitial = (member.full_name?.trim().charAt(0) || '?').toUpperCase();
  const gradientColors = AVATAR_GRADIENTS[member.id % AVATAR_GRADIENTS.length];

  const isPaid = member.status === 'active';
  const isExpired = member.status === 'expired';
  const isUnpaid = member.status === 'unpaid';
  const isInactive = member.status === 'inactive';

  const statusConfig = isPaid
    ? {
        label: t('active', 'Active'),
        bg: '#E8FAEE',
        dot: '#16A34A',
        text: '#059669',
        barBg: '#EAF8EE',
        accent: '#10B981',
        bannerText: '#065F46',
      }
    : isExpired
    ? {
        label: t('expired', 'Expired'),
        bg: '#FEECEE',
        dot: '#DC2626',
        text: '#DC2626',
        barBg: '#FEF2F2',
        accent: '#EF4444',
        bannerText: '#B91C1C',
      }
    : isUnpaid
    ? {
        label: t('unpaid', 'Unpaid'),
        bg: '#FFF4E0',
        dot: '#EA580C',
        text: '#D97706',
        barBg: '#FFF7E6',
        accent: '#F59E0B',
        bannerText: '#B45309',
      }
    : {
        label: 'Inactive',
        bg: '#F1F5F9',
        dot: '#64748B',
        text: '#64748B',
        barBg: '#F1F5F9',
        accent: '#94A3B8',
        bannerText: '#475569',
      };

  const getRemainingDaysLabel = () => {
    if (isInactive) {
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

  const primaryBtnLabel =
    isExpired || isUnpaid
      ? t('activateShort', 'Activate')
      : isPaid
      ? t('renewShort', 'Renew')
      : t('recordPayment', 'Pay');

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: statusConfig.accent }]}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      {/* Top Row: Vibrant Circular Avatar, Details Stack, and Top-Right Status Pill */}
      <View style={styles.headerRow}>
        <View style={styles.avatarWrapper}>
          {member.photo_uri ? (
            <Image source={{ uri: member.photo_uri }} style={styles.avatarCircle} />
          ) : (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarInitial}>{firstInitial}</Text>
            </LinearGradient>
          )}
          {isPaid && (
            <View style={styles.avatarCheckBadge}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.nameContainer}>
          <View style={styles.topNameLine}>
            <Text style={styles.name} numberOfLines={1}>
              {member.full_name}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
              <Text style={[styles.statusPillText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="card" size={13} color="#334155" style={styles.metaIcon} />
            <Text style={styles.metaText} numberOfLines={1}>
              {member.gym_id} • {categoryLabel}
            </Text>
          </View>

          {member.phone ? (
            <View style={styles.metaRow}>
              <Ionicons name="call" size={12} color="#0F172A" style={styles.metaIcon} />
              <Text style={styles.phoneText} numberOfLines={1}>
                {member.phone}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Detailed Mode Extra Plan & Last Payment Info */}
      {detailed && (
        <View style={styles.extraDetailsSection}>
          <View style={styles.detailRow}>
            <Ionicons name="fitness-outline" size={14} color={colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{t('membershipPlan', 'Membership Plan')}: </Text>
            <Text style={styles.detailValue}>
              {member.current_plan_name || 'None'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="receipt-outline" size={14} color={colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{t('lastPayment', 'Last Payment')}: </Text>
            <Text style={styles.detailValue}>
              {member.last_payment_date
                ? `${member.last_payment_date} (${member.last_payment_amount} ETB)`
                : 'None'}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Tinted Strip: Remaining Days + Inline Renew/Activate & View Pills */}
      <View style={[styles.bottomStatusBar, { backgroundColor: statusConfig.barBg }]}>
        <View style={styles.bottomLeftInfo}>
          <Ionicons
            name={isPaid ? 'calendar' : isExpired ? 'alert-circle' : 'time'}
            size={18}
            color={statusConfig.bannerText}
            style={styles.calendarIcon}
          />
          <View style={styles.daysTextCol}>
            <Text
              style={[styles.remainingDaysText, { color: statusConfig.bannerText }]}
              numberOfLines={1}
            >
              {getRemainingDaysLabel()}
            </Text>
            <Text style={styles.validUntilText} numberOfLines={1}>
              {isPaid
                ? `${t('validUntil', 'Valid until')} ${member.membership_end_date}`
                : isExpired
                ? `${t('expiredOn', 'Expired on')} ${member.membership_end_date}`
                : t('paymentRequired', 'Payment required')}
            </Text>
          </View>
        </View>

        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={styles.renewBtn}
            onPress={handlePayPress}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isExpired || isUnpaid ? 'flash' : 'refresh'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.renewBtnText}>{primaryBtnLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewBtn}
            onPress={handleCardPress}
            activeOpacity={0.8}
          >
            <Ionicons name="eye" size={14} color="#0F172A" />
            <Text style={styles.viewBtnText}>{t('viewShort', 'View')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9EEF5',
    borderLeftWidth: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    width: 54,
    height: 54,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  topNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  name: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  metaIcon: {
    marginRight: 5,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  extraDetailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    gap: 8,
  },
  bottomLeftInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: 7,
  },
  daysTextCol: {
    flex: 1,
  },
  remainingDaysText: {
    fontSize: 12,
    fontWeight: '800',
  },
  validUntilText: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 1,
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#045E2F',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 4,
  },
  renewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3EC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 4,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
});
