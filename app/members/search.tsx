import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { SearchBar } from '../../src/components/SearchBar';
import { MemberCard } from '../../src/components/MemberCard';
import { EmptyState } from '../../src/components/EmptyState';
import { MemberWithStatus } from '../../src/types';
import { searchMemberByIdOrPhone } from '../../src/services/memberService';

export default function MemberSearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberWithStatus[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchMemberByIdOrPhone(query.trim());
      setResults(data);
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title={t('memberSearch', 'Member Search')} showBack={true} dark={true} />

      <View style={styles.searchBox}>
        <SearchBar
          value={query}
          onChangeText={(txt) => {
            setQuery(txt);
            if (!txt) {
              setResults([]);
              setHasSearched(false);
            }
          }}
          onSearch={handleSearch}
          placeholder={t('searchMemberPlaceholder', 'Student ID, Gym ID or phone number')}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MemberCard member={item} detailed={true} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          hasSearched && !loading ? (
            <EmptyState
              icon="search-outline"
              title={t('noMemberFound', 'No member found')}
              message={`No member found with query "${query}".`}
              actionTitle={t('registerMember', 'Register New Member')}
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
  searchBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
});
