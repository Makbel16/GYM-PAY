import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MemberWithStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

interface MemberCardProps {
  member: MemberWithStatus;
  detailed?: boolean;
  onPress?: () => void;
  onRecordPayment?: () => void;
}

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

  const initials = member.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isPaid = member.status === 'active';
  const isExpired = member.status === 'expired';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.85}
    >
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {member.full_name}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {categoryLabel} • {member.gym_id}
          </Text>
        </View>

        <StatusBadge status={member.status} size={detailed ? 'large' : 'medium'} />
      </View>

      {detailed && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{t('membershipExpires', 'Membership Expires')}: </Text>
            <Text style={styles.detailValue}>
              {member.membership_end_date || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={16} color={colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{t('membershipPlan', 'Membership Plan')}: </Text>
            <Text style={styles.detailValue}>
              {member.current_plan_name || 'None'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="receipt-outline" size={16} color={colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{t('lastPayment', 'Last Payment')}: </Text>
            <Text style={styles.detailValue}>
              {member.last_payment_date ? `${member.last_payment_date} (${member.last_payment_amount} ETB)` : 'None'}
            </Text>
          </View>

          {/* Status banner */}
          <View
            style={[
              styles.statusBanner,
              isPaid
                ? styles.bannerActive
                : isExpired
                ? styles.bannerExpired
                : styles.bannerUnpaid,
            ]}
          >
            <Ionicons
              name={isPaid ? 'checkmark-circle' : isExpired ? 'close-circle' : 'alert-circle'}
              size={18}
              color={isPaid ? colors.primary : isExpired ? colors.statRedIcon : colors.statOrangeIcon}
            />
            <Text
              style={[
                styles.statusBannerText,
                {
                  color: isPaid
                    ? colors.primary
                    : isExpired
                    ? colors.statRedIcon
                    : colors.statOrangeIcon,
                },
              ]}
            >
              {isPaid
                ? `${t('membershipIsActive', 'Membership is Active')} • ${t('validUntil', 'Valid until')} ${member.membership_end_date}`
                : isExpired
                ? `${t('membershipIsExpired', 'Membership has Expired')} (${member.membership_end_date})`
                : t('membershipIsUnpaid', 'No Active Membership Found')}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={handleCardPress}
              activeOpacity={0.7}
            >
              <Text style={styles.outlineButtonText}>{t('viewDetails', 'View Details')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.solidButton}
              onPress={handlePayPress}
              activeOpacity={0.8}
            >
              <Text style={styles.solidButtonText}>{t('recordPayment', 'Record Payment')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailsContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  bannerActive: {
    backgroundColor: colors.primaryUltralight,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  bannerExpired: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bannerUnpaid: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  outlineButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlineButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  solidButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  solidButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
