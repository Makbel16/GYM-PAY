import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { InputField } from '../../src/components/InputField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Gender, MemberCategory } from '../../src/types';
import { registerMember } from '../../src/services/memberService';

export default function RegisterMemberScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [category, setCategory] = useState<MemberCategory>('student');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError(t('requiredField', 'Full name is required'));
      return;
    }

    if (category === 'student' && !studentId.trim()) {
      setError('University Student ID is required for student registration');
      return;
    }

    if (!phone.trim()) {
      setError(t('requiredField', 'Phone number is required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newMember = await registerMember({
        fullName,
        category,
        studentId: category === 'student' ? studentId.trim() : undefined,
        phone,
        gender,
      });

      Alert.alert(
        t('success', 'Success'),
        `${t('registerSuccess', 'Member registered successfully!')}\nAssigned Gym ID: ${newMember.gym_id}`,
        [
          {
            text: t('recordPayment', 'Record Payment'),
            onPress: () =>
              router.replace({
                pathname: '/payments/record',
                params: { memberId: newMember.id },
              } as any),
          },
          {
            text: t('viewDetails', 'View Member'),
            onPress: () => router.replace(`/members/${newMember.id}` as any),
          },
        ]
      );
    } catch (e: any) {
      setError(e.message || 'Failed to register member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CustomHeader
        title={t('registerMember', 'Register Member')}
        showBack={true}
        dark={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category Selector Tabs matching Screen 5 */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              category === 'student' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setCategory('student');
              setError('');
            }}
          >
            <Text
              style={[
                styles.segmentText,
                category === 'student' && styles.segmentTextActive,
              ]}
            >
              {t('student', 'Student')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              category === 'staff' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setCategory('staff');
              setError('');
            }}
          >
            <Text
              style={[
                styles.segmentText,
                category === 'staff' && styles.segmentTextActive,
              ]}
            >
              {t('staff', 'Staff')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              category === 'external' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setCategory('external');
              setError('');
            }}
          >
            <Text
              style={[
                styles.segmentText,
                category === 'external' && styles.segmentTextActive,
              ]}
            >
              {t('external', 'External')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Avatar Graphic */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <Ionicons
              name={
                category === 'student'
                  ? 'school'
                  : category === 'staff'
                  ? 'briefcase'
                  : 'body'
              }
              size={48}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Error message */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.statRedIcon} />
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        {/* Registration Form */}
        <View style={styles.formCard}>
          <InputField
            label={t('fullName', 'Full Name')}
            value={fullName}
            onChangeText={(txt) => {
              setFullName(txt);
              setError('');
            }}
            placeholder="Abebe Kebede"
            icon="person-outline"
            required
            autoCapitalize="words"
          />

          {category === 'student' ? (
            <InputField
              label={t('studentId', 'Student ID')}
              value={studentId}
              onChangeText={(txt) => {
                setStudentId(txt);
                setError('');
              }}
              placeholder={t('studentIdPlaceholder', 'e.g. DBU-2024-001')}
              icon="id-card-outline"
              required
              autoCapitalize="characters"
            />
          ) : (
            <View style={styles.autoIdNotice}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <View style={styles.autoIdTextContainer}>
                <Text style={styles.autoIdTitle}>
                  {category === 'staff' ? 'Staff Gym ID' : 'External Gym ID'}
                </Text>
                <Text style={styles.autoIdSubtitle}>
                  {category === 'staff'
                    ? t('staffIdNotice', 'Gym ID will be generated automatically (STF-XXXX).')
                    : t('externalIdNotice', 'Gym ID will be generated automatically (EXT-XXXX).')}
                </Text>
              </View>
            </View>
          )}

          <InputField
            label={t('phoneNumber', 'Phone Number')}
            value={phone}
            onChangeText={(txt) => {
              setPhone(txt);
              setError('');
            }}
            placeholder={t('phonePlaceholder', '+251 9X XXX XXXX')}
            icon="call-outline"
            keyboardType="phone-pad"
            required
          />

          {/* Gender selection */}
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

          {/* Info Banner matching Screen 5 */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color="#2563EB" />
            <Text style={styles.infoBannerText}>
              {category === 'student'
                ? t('studentIdNotice', 'Student members use their university student ID.')
                : category === 'staff'
                ? 'Staff gym members receive a permanent STF-XXXX Gym ID.'
                : 'External gym members receive a permanent EXT-XXXX Gym ID.'}
            </Text>
          </View>

          <PrimaryButton
            title={t('registerMember', 'Register Member')}
            onPress={handleRegister}
            icon="person-add"
            loading={loading}
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
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryUltralight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  autoIdNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryUltralight,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  autoIdTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  autoIdTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  autoIdSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBannerText: {
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 6,
  },
});
