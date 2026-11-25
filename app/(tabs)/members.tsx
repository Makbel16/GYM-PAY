import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { GymScreenContainer, HeaderActionPill } from '../../src/components/CustomHeader';
import { MemberCard } from '../../src/components/MemberCard';
import { EmptyState } from '../../src/components/EmptyState';
import { MemberCategory, MembershipStatus, MemberWithStatus } from '../../src/types';
import { getAllMembers } from '../../src/services/memberService';

export default function MembersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ filterStatus?: string }>();

  const [allMembers, setAllMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemberCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MembershipStatus | 'all'>(
    (params.filterStatus as MembershipStatus) || 'all'
  );
  const [sortByName, setSortByName] = useState(false);

  const loadMembers = async () => {
    try {
      const data = await getAllMembers({
        category: selectedCategory,
        status: 'all',
        searchQuery: searchQuery.trim(),
      });
      setAllMembers(data);
    } catch (e) {
      console.error('Failed to load members', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (params.filterStatus) {
        setSelectedStatus(params.filterStatus as MembershipStatus);
      }
      loadMembers();
    }, [selectedCategory, searchQuery, params.filterStatus])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const totalCount = allMembers.length;
  const activeCount = useMemo(
    () => allMembers.filter((m) => m.status === 'active').length,
    [allMembers]
  );
  const expiredCount = useMemo(
    () => allMembers.filter((m) => m.status === 'expired').length,
    [allMembers]
  );
  const unpaidCount = useMemo(
    () => allMembers.filter((m) => m.status === 'unpaid').length,
    [allMembers]
  );

  const filteredMembers = useMemo(() => {
    const byStatus =
      selectedStatus === 'all'
        ? allMembers
        : allMembers.filter((m) => m.status === selectedStatus);
    if (!sortByName) return byStatus;
    return [...byStatus].sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [allMembers, selectedStatus, sortByName]);

  const categories: { key: MemberCategory | 'all'; label: string; icon: any }[] = [
    { key: 'all', label: `${t('all', 'All')} (${totalCount})`, icon: 'people' },
    { key: 'student', label: t('student', 'Student'), icon: 'school' },
    { key: 'staff', label: t('staff', 'Staff'), icon: 'briefcase' },
    { key: 'external', label: t('external', 'External'), icon: 'globe-outline' },
  ];

  return (
    <GymScreenContainer
      title={t('members', 'Members')}
      subtitle={t('manageMembersSubtitle', 'Manage your gym members easily')}
      icon="barbell"
      rightAction={
        <HeaderActionPill
          label={t('add', 'Add')}
          icon="add"
          onPress={() => router.push('/members/register' as any)}
        />
      }
    >
      {/* Top 4 Status Summary Filter Cards */}
        <View style={styles.summaryStrip}>
          <TouchableOpacity
            style={[
              styles.summaryCardWrapper,
              selectedStatus === 'all' && styles.summaryCardSelectedBorderDark,
            ]}
            onPress={() => setSelectedStatus('all')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#0A7B42', '#022A16']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCardTotal}
            >
              <Ionicons name="people" size={18} color="#86EFAC" style={styles.summaryLeftIcon} />
              <View>
                <Text style={styles.summaryCountWhite}>{totalCount}</Text>
                <Text style={styles.summaryLabelWhite}>{t('total', 'Total')}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.summaryCard,
              { backgroundColor: '#DCFCE7' },
              selectedStatus === 'active' && styles.summaryCardSelectedGreen,
            ]}
            onPress={() => setSelectedStatus(selectedStatus === 'active' ? 'all' : 'active')}
            activeOpacity={0.85}
          >
            <View style={[styles.summaryDotIcon, { backgroundColor: '#16A34A' }]}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.summaryCountDark}>{activeCount}</Text>
              <Text style={styles.summaryLabelDark}>{t('active', 'Active')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.summaryCard,
              { backgroundColor: '#FEF0D5' },
              selectedStatus === 'expired' && styles.summaryCardSelectedOrange,
            ]}
            onPress={() => setSelectedStatus(selectedStatus === 'expired' ? 'all' : 'expired')}
            activeOpacity={0.85}
          >
            <View style={[styles.summaryDotIcon, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="time" size={12} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.summaryCountDark}>{expiredCount}</Text>
              <Text style={styles.summaryLabelDark}>{t('expired', 'Expired')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.summaryCard,
              { backgroundColor: '#FFE2E5' },
              selectedStatus === 'unpaid' && styles.summaryCardSelectedRed,
            ]}
            onPress={() => setSelectedStatus(selectedStatus === 'unpaid' ? 'all' : 'unpaid')}
            activeOpacity={0.85}
          >
            <View style={[styles.summaryDotIcon, { backgroundColor: '#DC2626' }]}>
              <Ionicons name="ban" size={12} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.summaryCountDark}>{unpaidCount}</Text>
              <Text style={styles.summaryLabelDark}>{t('unpaid', 'Unpaid')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Input Pill + Filter/Sort Icon Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputBox}>
            <Ionicons name="search" size={19} color="#0F172A" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInputText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchIdPhoneName', 'Search by ID, Phone or Name...')}
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterBtn, sortByName && styles.filterBtnActive]}
            onPress={() => setSortByName((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options"
              size={20}
              color={sortByName ? '#FFFFFF' : '#058C42'}
            />
          </TouchableOpacity>
        </View>

        {/* Category Filter Chips */}
        <View style={styles.categoryBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={active ? '#FFFFFF' : '#0F172A'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Member Cards List */}
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              detailed={false}
              onRecordPayment={() =>
                router.push({
                  pathname: '/payments/record',
                  params: { memberId: item.id },
                } as any)
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#059669"
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon="people-outline"
                title={t('noMemberFound', 'No members found')}
                message={
                  searchQuery
                    ? `No members matching "${searchQuery}". Check the ID or name.`
                    : 'Get started by registering your gym members'
                }
                actionTitle={t('registerMember', 'Register New Member')}
                onAction={() => router.push('/members/register' as any)}
              />
            ) : undefined
          }
        />
    </GymScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryStrip: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 7,
  },
  summaryCardWrapper: {
    flex: 1.05,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  summaryCardSelectedBorderDark: {
    borderColor: '#22C55E',
  },
  summaryCardTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    gap: 6,
  },
  summaryLeftIcon: {
    marginRight: 1,
  },
  summaryCountWhite: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 19,
  },
  summaryLabelWhite: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#D1FAE5',
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 15,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  summaryCardSelectedGreen: {
    borderColor: '#16A34A',
  },
  summaryCardSelectedOrange: {
    borderColor: '#EA580C',
  },
  summaryCardSelectedRed: {
    borderColor: '#DC2626',
  },
  summaryDotIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCountDark: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 19,
  },
  summaryLabelDark: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 8,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputText: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  filterBtnActive: {
    backgroundColor: '#045B2B',
    borderColor: '#045B2B',
  },
  categoryBarWrapper: {
    paddingBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#045B2B',
    borderColor: '#045B2B',
  },
  categoryPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 28,
  },
});
