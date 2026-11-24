import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { GymLogo } from '../../src/components/GymLogo';
import { InputField, InputHandle } from '../../src/components/InputField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { registerAdmin } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';

export default function SetupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setAdminDirectly } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullNameRef = useRef<InputHandle>(null);
  const usernameRef = useRef<InputHandle>(null);
  const passwordRef = useRef<InputHandle>(null);
  const confirmPasswordRef = useRef<InputHandle>(null);

  const handleCreateAdmin = async () => {
    if (!fullName.trim() || !username.trim() || !password || !confirmPassword) {
      setError(t('requiredField', 'Please fill in all required fields'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch', 'Passwords do not match'));
      return;
    }

    if (password.length < 4) {
      setError('Password/PIN must be at least 4 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const admin = await registerAdmin(username, password, fullName);
      setAdminDirectly(admin);
      Alert.alert(
        t('success', 'Success'),
        t('setupSuccess', 'Administrator account created successfully!'),
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (e: any) {
      setError(e.message || 'Failed to create administrator account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <GymLogo size="medium" showSubtitle={false} />
          <Text style={styles.title}>{t('setupTitle', 'First-time Admin Setup')}</Text>
          <Text style={styles.subtitle}>
            {t('setupSubtitle', 'Create the primary administrator account for DBU Gym')}
          </Text>
        </View>

        <View style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <InputField
            ref={fullNameRef}
            label={t('adminName', 'Administrator Full Name')}
            value={fullName}
            onChangeText={(txt) => {
              setFullName(txt);
              setError('');
            }}
            placeholder="e.g. Abebe Kebede"
            icon="person-outline"
            required
            dark={true}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => usernameRef.current?.focus()}
            blurOnSubmit={false}
          />

          <InputField
            ref={usernameRef}
            label={t('username', 'Username')}
            value={username}
            onChangeText={(txt) => {
              setUsername(txt);
              setError('');
            }}
            placeholder="admin"
            icon="at-outline"
            autoCapitalize="none"
            required
            dark={true}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />

          <InputField
            ref={passwordRef}
            label={t('password', 'Password / PIN')}
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              setError('');
            }}
            placeholder="••••••••"
            secureTextEntry
            icon="lock-closed-outline"
            required
            dark={true}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            blurOnSubmit={false}
          />

          <InputField
            ref={confirmPasswordRef}
            label={t('confirmPassword', 'Confirm Password')}
            value={confirmPassword}
            onChangeText={(txt) => {
              setConfirmPassword(txt);
              setError('');
            }}
            placeholder="••••••••"
            secureTextEntry
            icon="lock-closed-outline"
            required
            dark={true}
            returnKeyType="done"
            onSubmitEditing={handleCreateAdmin}
          />

          <PrimaryButton
            title={t('createAdminButton', 'Create Admin Account')}
            onPress={handleCreateAdmin}
            icon="shield-checkmark-outline"
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
    backgroundColor: colors.navyDarkest,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 300,
  },
  card: {
    backgroundColor: colors.navyCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  errorText: {
    color: colors.statRedIcon,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 10,
  },
});
