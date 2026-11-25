import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Rect,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import {
  getTabBarHeight,
  HeaderWaveBackground,
} from '../../src/components/CustomHeader';
import { MemberCard } from '../../src/components/MemberCard';
import { EmptyState } from '../../src/components/EmptyState';
import { MemberWithStatus } from '../../src/types';
import { searchMemberByIdOrPhone } from '../../src/services/memberService';

function VerificationShieldEmblem() {
  return (
    <Svg width={128} height={84} viewBox="0 0 128 84">
      <Defs>
        <SvgLinearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#22C55E" />
          <Stop offset="100%" stopColor="#04783A" />
        </SvgLinearGradient>
        <SvgLinearGradient id="cardGradLeft" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#16A34A" />
          <Stop offset="100%" stopColor="#065F46" />
        </SvgLinearGradient>
      </Defs>

      {/* Soft mint glow */}
      <Circle cx="64" cy="44" r="36" fill="#ECFDF5" />

      {/* Decorative confetti dots */}
      <Circle cx="20" cy="24" r="2.2" fill="#4ADE80" />
      <Circle cx="15" cy="36" r="1.5" fill="#86EFAC" />
      <Circle cx="106" cy="22" r="2.2" fill="#4ADE80" />
      <Circle cx="112" cy="34" r="1.6" fill="#86EFAC" />
      <Path
        d="M99 13L102 16L99 19"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Right tilted faint card */}
      <Rect
        x="62"
        y="25"
        width="44"
        height="30"
        rx="5"
        fill="#BBF7D0"
        transform="rotate(11 84 40)"
      />
      <Rect
        x="68"
        y="34"
        width="16"
        height="3.5"
        rx="1.5"
        fill="#FFFFFF"
        transform="rotate(11 84 40)"
      />

      {/* Left tilted emerald card */}
      <Rect
        x="22"
        y="26"
        width="46"
        height="31"
        rx="5.5"
        fill="url(#cardGradLeft)"
        transform="rotate(-12 45 41)"
      />
      <Rect
        x="27"
        y="34"
        width="34"
        height="4"
        rx="1.5"
        fill="#A7F3D0"
        transform="rotate(-12 45 41)"
      />
      <Rect
        x="27"
        y="43"
        width="14"
        height="3.5"
        rx="1.5"
        fill="#FFFFFF"
        transform="rotate(-12 45 41)"
      />
      <Rect
        x="27"
        y="49"
        width="10"
        height="3"
        rx="1.5"
        fill="#86EFAC"
        transform="rotate(-12 45 41)"
      />

      {/* Center Emerald Shield */}
      <Path
        d="M64 11L85 19.5V39C85 53.5 75.5 64 64 69.5C52.5 64 43 53.5 43 39V19.5L64 11Z"
        fill="url(#shieldGrad)"
        stroke="#A7F3D0"
        strokeWidth="2.2"
      />

      {/* White Checkmark inside Shield */}
      <Path
        d="M55 39.5L61.2 45.8L73.5 32.5"
        stroke="#FFFFFF"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export default function PaymentVerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const headerHeight = Math.max(insets.top + 104, 144);

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" />

      {/* Top Header using shared top portion of BG2.png (athlete + curved emerald wave) */}
      <View style={[styles.headerContainer, { height: headerHeight }]}>
        <HeaderWaveBackground height={headerHeight} />

        <View style={[styles.headerInner, { paddingTop: Math.max(insets.top + 2, 34) }]}>
          {/* Top Navigation Bar: Back & History Icons */}
          <View style={styles.topActionBar}>
            <TouchableOpacity
              style={styles.topCircleIconBtn}
              onPress={() => router.back()}
              activeOpacity={0.75}
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topCircleIconBtn}
              onPress={() => router.push('/payments/history' as any)}
              activeOpacity={0.75}
            >
              <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Header Title Row */}
          <View style={styles.headerTitleRow}>
            <LinearGradient
              colors={['#22C55E', '#058C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCircleBadge}
            >
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>{t('payments', 'Payments')}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {t('paymentVerificationSubtitle', 'Verify eligibility & record payments')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: getTabBarHeight(insets.bottom) + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Rounded Search Input Pill + Full-Width Gradient Search Button */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputPill}>
            <Ionicons name="search" size={20} color="#475569" style={styles.searchInputIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={(txt) => {
                setSearchQuery(txt);
                if (!txt) {
                  setResults([]);
                  setHasSearched(false);
                }
              }}
              placeholder={t('searchMemberPlaceholder', 'Enter ID or Phone Number')}
              placeholderTextColor="#64748B"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setResults([]);
                setHasSearched(false);
              }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => handleSearch()}
            activeOpacity={0.85}
            style={styles.searchBtnWrapper}
          >
            <LinearGradient
              colors={['#0B8845', '#02592A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.searchBtnGradient}
            >
              <Ionicons name="search" size={19} color="#FFFFFF" />
              <Text style={styles.searchBtnText}>{t('searchButton', 'Search')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Results OR Instant Payment Verification Card */}
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
          <View style={styles.verificationCard}>
            {/* Bottom portion of BG2.png showing the 3 silhouettes & emerald waves */}
            <Image
              source={require('../../assets/images/BG2.png')}
              style={styles.cardBottomBgImage}
              resizeMode="cover"
            />

            <View style={styles.cardForeground}>
              <VerificationShieldEmblem />

              <Text style={styles.instructionTitle}>
                {t('instantPaymentVerification', 'Instant Payment Verification')}
              </Text>
              <Text style={styles.instructionText}>
                {t(
                  'searchInstruction',
                  'Enter a Student ID, Gym ID, or registered phone number to verify membership status.'
                )}
              </Text>

              {/* 3-Row Legend Box with Status Pills */}
              <View style={styles.legendCard}>
                {/* Row 1: Green */}
                <View style={styles.legendRow}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>
                      {t('legendActive', 'GREEN : Active / Paid')}
                    </Text>
                  </View>
                  <View style={[styles.outcomePill, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                    <Text style={[styles.outcomeText, { color: '#15803D' }]}>
                      {t('accessGranted', 'Access Granted')}
                    </Text>
                  </View>
                </View>

                {/* Row 2: Red */}
                <View style={styles.legendRow}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>
                      {t('legendExpired', 'RED : Expired Membership')}
                    </Text>
                  </View>
                  <View style={[styles.outcomePill, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="ban" size={14} color="#DC2626" />
                    <Text style={[styles.outcomeText, { color: '#B91C1C' }]}>
                      {t('accessDenied', 'Access Denied')}
                    </Text>
                  </View>
                </View>

                {/* Row 3: Orange */}
                <View style={styles.legendRow}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>
                      {t('legendUnpaid', 'ORANGE : Unpaid / No Plan')}
                    </Text>
                  </View>
                  <View style={[styles.outcomePill, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="warning" size={14} color="#D97706" />
                    <Text style={[styles.outcomeText, { color: '#B45309' }]}>
                      {t('paymentRequired', 'Payment Required')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#022211',
  },
  headerInner: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topCircleIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletCircleBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchInputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInputIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '500',
  },
  searchBtnWrapper: {
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#02592A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBtnGradient: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  resultsContainer: {
    marginTop: 4,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    marginLeft: 4,
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  cardBottomBgImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    aspectRatio: 1024 / 1536,
  },
  cardForeground: {
    paddingTop: 22,
    paddingHorizontal: 14,
    paddingBottom: 112,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  instructionText: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  legendCard: {
    width: '100%',
    backgroundColor: 'rgba(248, 250, 252, 0.94)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 9,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  outcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  outcomeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
