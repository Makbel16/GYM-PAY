import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { SearchBar } from '../../src/components/SearchBar';
import { MemberCard } from '../../src/components/MemberCard';
import { EmptyState } from '../../src/components/EmptyState';
import { MemberWithStatus } from '../../src/types';
import { searchMemberByIdOrPhone } from '../../src/services/memberService';

export default function PaymentVerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ initialQuery?: string }>();

  const [searchQuery, setSearchQuery] = useState(params.initialQuery || '');
  const [results, setResults] = useState<MemberWithStatus[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (queryText?: string) => {
    const q = queryText !== undefined ? queryText : searchQuery;
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);

    try {
      const found = await searchMemberByIdOrPhone(q.trim());
      setResults(found);
    } catch (e) {
      console.error('Search verification failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.initialQuery) {
      setSearchQuery(params.initialQuery);
      handleSearch(params.initialQuery);
    }
  }, [params.initialQuery]);

  useFocusEffect(
    useCallback(() => {
      if (searchQuery.trim() && hasSearched) {
        handleSearch();
      }
    }, [searchQuery, hasSearched])
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title={t('memberSearch', 'Member Search')}
        subtitle={t('gymManagement', 'Payment Verification')}
        dark={true}
        rightAction={
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => router.push('/payments/history' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Card Section matching Screen 3 */}
        <View style={styles.searchCard}>
          <SearchBar
            value={searchQuery}
            onChangeText={(txt) => {
              setSearchQuery(txt);
              if (!txt) {
                setResults([]);
                setHasSearched(false);
              }
            }}
            onSearch={() => handleSearch()}
            showSearchButton={true}
            placeholder={t('searchMemberPlaceholder', 'Student ID, Gym ID or phone number')}
          />
        </View>

        {/* Results Section */}
        {hasSearched ? (
          results.length > 0 ? (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsCount}>
                Found {results.length} matching member{results.length > 1 ? 's' : ''}
              </Text>
              {results.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  detailed={true}
                  onRecordPayment={() =>
                    router.push({
                      pathname: '/payments/record',
                      params: { memberId: member.id },
                    } as any)
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="person-remove-outline"
              title={t('noMemberFound', 'No member found')}
              message={`No member was found matching "${searchQuery}". Check the ID or phone number and try again.`}
              actionTitle={t('registerMember', 'Register New Member')}
              onAction={() => router.push('/members/register' as any)}
            />
          )
        ) : (
          <View style={styles.instructionCard}>
            <View style={styles.instructionIconWrapper}>
              <Ionicons name="shield-checkmark" size={36} color={colors.primary} />
            </View>
            <Text style={styles.instructionTitle}>Instant Payment Verification</Text>
            <Text style={styles.instructionText}>
              {t(
                'searchInstruction',
                'Enter a Student ID, Gym ID, or registered phone number to verify membership eligibility in seconds.'
              )}
            </Text>

            <View style={styles.statusLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: colors.statusActive.dot }]} />
                <Text style={styles.legendTitle}>GREEN: Active / Paid</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: colors.statusExpired.dot }]} />
                <Text style={styles.legendTitle}>RED: Expired Membership</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: colors.statusUnpaid.dot }]} />
                <Text style={styles.legendTitle}>ORANGE: Unpaid / No Plan</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  searchCard: {
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
  resultsContainer: {
    marginTop: 4,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    marginLeft: 4,
  },
  instructionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  instructionIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryUltralight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statusLegend: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
