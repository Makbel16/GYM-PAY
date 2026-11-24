import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { MemberCard } from '../../src/components/MemberCard';
import { SearchBar } from '../../src/components/SearchBar';
import { EmptyState } from '../../src/components/EmptyState';
import { MemberCategory, MembershipStatus, MemberWithStatus } from '../../src/types';
import { getAllMembers } from '../../src/services/memberService';

export default function MembersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ filterStatus?: string }>();

  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemberCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MembershipStatus | 'all'>(
    (params.filterStatus as MembershipStatus) || 'all'
  );

  const loadMembers = async () => {
    try {
      const data = await getAllMembers({
        category: selectedCategory,
        status: selectedStatus,
        searchQuery: searchQuery,
      });
      setMembers(data);
    } catch (e) {
      console.error('Failed to load members', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [selectedCategory, selectedStatus, searchQuery])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const categories: { key: MemberCategory | 'all'; label: string }[] = [
    { key: 'all', label: t('all', 'All') },
    { key: 'student', label: t('student', 'Student') },
    { key: 'staff', label: t('staff', 'Staff') },
    { key: 'external', label: t('external', 'External') },
  ];

  const statuses: { key: MembershipStatus | 'all'; label: string }[] = [
    { key: 'all', label: t('all', 'All') },
    { key: 'active', label: t('active', 'Active') },
    { key: 'expired', label: t('expired', 'Expired') },
    { key: 'unpaid', label: t('unpaid', 'Unpaid') },
    { key: 'inactive', label: 'Inactive' },
  ];

  return (
    <View style={styles.container}>
      <CustomHeader
        title={t('members', 'Gym Members')}
        subtitle={`${members.length} ${t('totalMembers', 'Members')}`}
        dark={true}
        rightAction={
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => router.push('/members/register' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.topFilterSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearch={loadMembers}
          showSearchButton={false}
          placeholder={t('searchMemberPlaceholder', 'Search by name, ID or phone...')}
        />

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContainer}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.filterPill,
                selectedCategory === cat.key && styles.filterPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedCategory === cat.key && styles.filterPillTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusPillsContainer}
        >
          {statuses.map((st) => (
            <TouchableOpacity
              key={st.key}
              style={[
                styles.statusPill,
                selectedStatus === st.key && styles.statusPillActive,
              ]}
              onPress={() => setSelectedStatus(st.key)}
            >
              <Text
                style={[
                  styles.statusPillText,
                  selectedStatus === st.key && styles.statusPillTextActive,
                ]}
              >
                {st.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MemberCard member={item} detailed={false} />}
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
              icon="people-outline"
              title={t('noMemberFound', 'No members found')}
              message={
                searchQuery
                  ? 'Try a different search term or clear filters'
                  : 'Get started by registering gym members'
              }
              actionTitle={t('registerMember', 'Register Member')}
              onAction={() => router.push('/members/register' as any)}
            />
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  topFilterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterPillsContainer: {
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: colors.primaryUltralight,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  statusPillsContainer: {
    paddingBottom: 4,
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusPillActive: {
    backgroundColor: colors.navyDark,
    borderColor: colors.navyDark,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
});
