import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { InputField } from '../../src/components/InputField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { LoadingIndicator } from '../../src/components/LoadingIndicator';
import { Gender, MemberWithStatus } from '../../src/types';
import { getMemberById, updateMember } from '../../src/services/memberService';

export default function EditMemberScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [member, setMember] = useState<MemberWithStatus | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const memberId = Number(id);

  useEffect(() => {
    async function load() {
      if (!memberId) return;
      try {
        const data = await getMemberById(memberId);
        if (data) {
          setMember(data);
          setFullName(data.full_name);
          setPhone(data.phone);
          setStudentId(data.institution_id || '');
          setGender((data.gender as Gender) || 'male');
        }
      } catch (e) {
        console.error('Failed to load member for editing', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [memberId]);

  const handleSave = async () => {
    if (!fullName.trim() || !phone.trim()) {
      setError(t('requiredField', 'Please fill in all required fields'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateMember(memberId, {
        fullName,
        phone,
        gender,
        studentId: member?.member_type === 'student' ? studentId.trim() : null,
      });

      Alert.alert(t('success', 'Success'), 'Member details updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setError(e.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title={t('editMember', 'Edit Member')} showBack={true} />
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CustomHeader title={t('editMember', 'Edit Member')} showBack={true} dark={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <InputField
            label={t('fullName', 'Full Name')}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
            icon="person-outline"
            required
          />

          {member?.member_type === 'student' && (
            <InputField
              label={t('studentId', 'Student ID')}
              value={studentId}
              onChangeText={setStudentId}
              placeholder="e.g. DBU-2024-001"
              icon="id-card-outline"
              required
            />
          )}

          <InputField
            label={t('phoneNumber', 'Phone Number')}
            value={phone}
            onChangeText={setPhone}
            placeholder="+251 9X XXX XXXX"
            icon="call-outline"
            keyboardType="phone-pad"
            required
          />

          {/* Gender */}
          <View style={styles.genderContainer}>
            <Text style={styles.genderLabel}>{t('gender', 'Gender')}</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[
                  styles.genderPill,
                  gender === 'male' && styles.genderPillActive,
                ]}
                onPress={() => setGender('male')}
              >
                <Ionicons
                  name="male"
                  size={16}
                  color={gender === 'male' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === 'male' && styles.genderTextActive,
                  ]}
                >
                  {t('male', 'Male')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderPill,
                  gender === 'female' && styles.genderPillActive,
                ]}
                onPress={() => setGender('female')}
              >
                <Ionicons
                  name="female"
                  size={16}
                  color={gender === 'female' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === 'female' && styles.genderTextActive,
                  ]}
                >
                  {t('female', 'Female')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <PrimaryButton
            title={t('save', 'Save Changes')}
            onPress={handleSave}
            icon="checkmark"
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
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    color: colors.statRedIcon,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    justifyContent: 'center',
  },
  genderPillActive: {
    backgroundColor: colors.primaryUltralight,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  genderTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 8,
  },
});
