import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { GymScreenContainer } from '../../src/components/CustomHeader';
import { Gender, MemberCategory } from '../../src/types';
import { registerMember } from '../../src/services/memberService';

export default function RegisterMemberScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<MemberCategory>('student');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullNameRef = useRef<any>(null);
  const studentIdRef = useRef<any>(null);
  const phoneRef = useRef<any>(null);

  const handlePickPhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const photosDir = `${FileSystem.documentDirectory}member_photos`;
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      }

      const ext = (asset.name?.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
      const destUri = `${photosDir}/member_${Date.now()}.${ext || 'jpg'}`;
      await FileSystem.copyAsync({
        from: asset.uri,
        to: destUri,
      });
      setPhotoUri(destUri);
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message || 'Could not select photo');
    }
  };

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
        photoUri,
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

  const categories: { key: MemberCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'student', label: t('student', 'Student'), icon: 'school' },
    { key: 'staff', label: t('staff', 'Staff'), icon: 'briefcase' },
    { key: 'external', label: t('external', 'External'), icon: 'people' },
  ];

  return (
    <GymScreenContainer
      title={t('registerMember', 'Register Member')}
      subtitle={t('manageMembersSubtitle', 'Add a new member to DBU Gym')}
      showBack={true}
      hasBottomTabBar={false}
      sheetBackgroundColor="#F8FAFC"
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 24, 34) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Category Pill Switcher matching reference: Student | Staff | External */}
          <View style={styles.segmentContainer}>
            {categories.map((cat) => {
              const isActive = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={styles.segmentTouch}
                  onPress={() => {
                    setCategory(cat.key);
                    setError('');
                  }}
                  activeOpacity={0.85}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['#0A8242', '#034B24']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.segmentBtnActive}
                    >
                      <Ionicons name={cat.icon} size={16} color="#FFFFFF" />
                      <Text style={styles.segmentTextActive}>{cat.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.segmentBtnInactive}>
                      <Ionicons name={cat.icon} size={16} color="#0F172A" />
                      <Text style={styles.segmentTextInactive}>{cat.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Photo Upload Circle matching reference */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handlePickPhoto}
              activeOpacity={0.85}
              style={styles.avatarTouch}
            >
              <View style={styles.avatarOuterHalo}>
                <View style={styles.avatarInnerCircle}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.uploadedPhoto} />
                  ) : (
                    <Ionicons name="person" size={44} color="#064E3B" />
                  )}
                </View>
              </View>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={15} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.uploadCaption}>
              {photoUri
                ? t('tapToChangePhoto', 'Tap to change photo')
                : t('tapToUploadPhoto', 'Tap to upload photo')}
            </Text>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.statRedIcon} />
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          ) : null}

          {/* Main White Registration Form Card matching reference */}
          <View style={styles.formCard}>
            {/* Row 1: Full Name */}
            <Pressable
              onPress={() => fullNameRef.current?.focus()}
              style={styles.fieldRow}
            >
              <View style={styles.leftIconCircle}>
                <Ionicons name="person-outline" size={20} color="#065F46" />
              </View>
              <View style={styles.fieldColumn}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>{t('fullName', 'Full Name')}</Text>
                  <Text style={styles.requiredStar}> *</Text>
                </View>
                <View style={styles.inputBox}>
                  <TextInput
                    ref={fullNameRef}
                    value={fullName}
                    onChangeText={(txt) => {
                      setFullName(txt);
                      setError('');
                    }}
                    placeholder={t('enterMemberFullName', 'Enter member full name')}
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() =>
                      category === 'student'
                        ? studentIdRef.current?.focus()
                        : phoneRef.current?.focus()
                    }
                    blurOnSubmit={false}
                    style={styles.textInput}
                  />
                </View>
              </View>
            </Pressable>

            {/* Row 2: Student ID or Auto-generated Gym ID */}
            {category === 'student' ? (
              <Pressable
                onPress={() => studentIdRef.current?.focus()}
                style={styles.fieldRow}
              >
                <View style={styles.leftIconCircle}>
                  <Ionicons name="card-outline" size={20} color="#065F46" />
                </View>
                <View style={styles.fieldColumn}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>{t('studentId', 'Student ID')}</Text>
                    <Text style={styles.requiredStar}> *</Text>
                  </View>
                  <View style={styles.inputBox}>
                    <TextInput
                      ref={studentIdRef}
                      value={studentId}
                      onChangeText={(txt) => {
                        setStudentId(txt);
                        setError('');
                      }}
                      placeholder={t('studentIdPlaceholder', 'e.g. DBU-2024-001')}
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      returnKeyType="next"
                      onSubmitEditing={() => phoneRef.current?.focus()}
                      blurOnSubmit={false}
                      style={styles.textInput}
                    />
                  </View>
                </View>
              </Pressable>
            ) : (
              <View style={styles.fieldRow}>
                <View style={styles.leftIconCircle}>
                  <Ionicons name="card-outline" size={20} color="#065F46" />
                </View>
                <View style={styles.fieldColumn}>
                  <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>
                    {category === 'staff' ? 'Staff Gym ID' : 'External Gym ID'}
                  </Text>
                  <View style={styles.autoIdBox}>
                    <Text style={styles.autoIdText}>
                      {category === 'staff'
                        ? t('staffIdNotice', 'Auto-generated (STF-XXXX)')
                        : t('externalIdNotice', 'Auto-generated (EXT-XXXX)')}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Row 3: Phone Number */}
            <Pressable
              onPress={() => phoneRef.current?.focus()}
              style={styles.fieldRow}
            >
              <View style={styles.leftIconCircle}>
                <Ionicons name="call" size={19} color="#065F46" />
              </View>
              <View style={styles.fieldColumn}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>{t('phoneNumber', 'Phone Number')}</Text>
                  <Text style={styles.requiredStar}> *</Text>
                </View>
                <View style={styles.inputBox}>
                  <TextInput
                    ref={phoneRef}
                    value={phone}
                    onChangeText={(txt) => {
                      setPhone(txt);
                      setError('');
                    }}
                    placeholder={t('phonePlaceholder', '+251 9X XXX XXXX')}
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    style={styles.textInput}
                  />
                </View>
              </View>
            </Pressable>

            {/* Row 4: Gender Header + Male / Female Cards */}
            <View style={styles.genderHeaderRow}>
              <View style={styles.leftIconCircle}>
                <Ionicons name="male" size={19} color="#065F46" />
              </View>
              <Text style={styles.fieldLabel}>{t('gender', 'Gender')}</Text>
            </View>

            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[
                  styles.genderPill,
                  gender === 'male' ? styles.genderPillActive : styles.genderPillInactive,
                ]}
                onPress={() => setGender('male')}
                activeOpacity={0.8}
              >
                <Ionicons name="male" size={17} color="#0F172A" />
                <Text style={styles.genderText}>{t('male', 'Male')}</Text>
                {gender === 'male' && (
                  <View style={styles.genderCheckCircle}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderPill,
                  gender === 'female' ? styles.genderPillActive : styles.genderPillInactive,
                ]}
                onPress={() => setGender('female')}
                activeOpacity={0.8}
              >
                <Ionicons name="female" size={17} color="#0F172A" />
                <Text style={styles.genderText}>{t('female', 'Female')}</Text>
                {gender === 'female' && (
                  <View style={styles.genderCheckCircle}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Banner inside Card matching reference */}
            <View style={styles.infoBanner}>
              <View style={styles.infoBlueCircle}>
                <Ionicons name="information" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.infoBannerText}>
                {category === 'student' ? (
                  <>
                    Student members use their{' '}
                    <Text style={styles.infoBannerHighlight}>
                      official university student ID
                    </Text>
                    .
                  </>
                ) : category === 'staff' ? (
                  <>
                    Staff members receive a permanent{' '}
                    <Text style={styles.infoBannerHighlight}>STF-XXXX Gym ID</Text>.
                  </>
                ) : (
                  <>
                    External members receive a permanent{' '}
                    <Text style={styles.infoBannerHighlight}>EXT-XXXX Gym ID</Text>.
                  </>
                )}
              </Text>
            </View>
          </View>

          {/* Bottom Full-Width Green Gradient Submit Button matching reference */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={['#0B8845', '#02592A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtnGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <View style={styles.submitBtnCenter}>
                    <Ionicons name="person-add" size={20} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>
                      {t('registerMember', 'Register Member')}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#FFFFFF"
                    style={styles.submitBtnArrow}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </GymScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 28,
    padding: 4,
    marginBottom: 16,
  },
  segmentTouch: {
    flex: 1,
  },
  segmentBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#034B24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentBtnInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  segmentTextActive: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  segmentTextInactive: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTouch: {
    position: 'relative',
  },
  avatarOuterHalo: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#BDECD0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#065F46',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  uploadCaption: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginTop: 7,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorBoxText: {
    color: colors.statRedIcon,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  leftIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldColumn: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  requiredStar: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 6,
  },
  autoIdBox: {
    backgroundColor: '#EAF8EE',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
  },
  autoIdText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#065F46',
  },
  genderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 8,
    position: 'relative',
  },
  genderPillActive: {
    backgroundColor: '#EAF8EE',
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  genderPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  genderCheckCircle: {
    position: 'absolute',
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoBlueCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerText: {
    fontSize: 12.5,
    color: '#334155',
    marginLeft: 10,
    flex: 1,
    lineHeight: 17,
  },
  infoBannerHighlight: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  submitBtnWrapper: {
    marginTop: 18,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#02592A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnGradient: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitBtnCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  submitBtnArrow: {
    position: 'absolute',
    right: 20,
  },
});
