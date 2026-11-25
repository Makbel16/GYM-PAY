import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { InputField, InputHandle } from '../../src/components/InputField';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';

function GreenLockIcon() {
  return (
    <Svg width={38} height={38} viewBox="0 0 36 36">
      <Path
        d="M11 15.5V10.8C11 6.95 14.13 3.8 18 3.8C21.87 3.8 25 6.95 25 10.8V15.5"
        stroke="#05843E"
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />
      <Rect x="6" y="14.5" width="24" height="17.5" rx="4.5" fill="#05843E" />
      <Circle cx="18" cy="22" r="2.1" fill="#FFFFFF" />
      <Path d="M16.7 23L16.1 27H19.9L19.3 23H16.7Z" fill="#FFFFFF" />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login, hasAdmin } = useAuth();
  const { language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const usernameRef = useRef<InputHandle>(null);
  const passwordRef = useRef<InputHandle>(null);

  const imgAspectRatio = 350 / 1050;
  const imgWidth = Math.max(screenWidth, screenHeight * imgAspectRatio);
  const imgHeight = Math.max(screenHeight, screenWidth / imgAspectRatio);
  const imgLeft = (screenWidth - imgWidth) / 2;

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setErrorMessage(t('requiredField', 'Please enter your username and password'));
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const success = await login(username.trim(), password);
      if (success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage(t('invalidCredentials', 'Invalid username or password'));
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" />

      {/* Pinned background image */}
      <Image
        source={require('../../assets/images/BG.png')}
        style={[
          styles.backgroundImage,
          {
            width: imgWidth,
            height: imgHeight,
            left: imgLeft,
            top: 0,
          },
        ]}
        resizeMode="cover"
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(7, 13, 24, 0.0)', 'rgba(7, 13, 24, 0.20)', 'rgba(7, 13, 24, 0.80)']}
        locations={[0, 0.36, 0.88]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 16, 100),
              paddingBottom: Math.max(insets.bottom + 16, 150),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Dedicated top spacer */}
          <View style={{ height: Math.max(screenHeight * 0.32, 140) }} pointerEvents="none" />

          {/* Clean White Login Card matching reference */}
          <View style={styles.formCard}>
            {/* Header Row: Green Lock Icon + Title & Subtitle */}
            <View style={styles.cardHeaderRow}>
              <GreenLockIcon />
              <View style={styles.cardHeaderText}>
                <Text style={styles.formTitle}>
                  {t('gymOwnerLogin', 'Gym Owner Login')}
                </Text>
                <Text style={styles.formSubtitle}>
                  {t('gymOwnerLoginSubtitle', 'Access your gym management')}
                </Text>
              </View>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.statRedIcon} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Username Input */}
            <InputField
              ref={usernameRef}
              value={username}
              onChangeText={(txt) => {
                setUsername(txt);
                setErrorMessage('');
              }}
              placeholder={t('username', 'Username')}
              icon="person"
              iconColor="#0F172A"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              style={styles.inputSpacing}
              inputContainerStyle={styles.inputBox}
            />

            {/* Password Input */}
            <InputField
              ref={passwordRef}
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                setErrorMessage('');
              }}
              placeholder={t('password', 'Password')}
              secureTextEntry
              icon="lock-closed"
              iconColor="#0F172A"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              style={styles.passwordSpacing}
              inputContainerStyle={styles.inputBox}
            />

            {/* Full-Width Pill Gradient Login Button with Right Arrow */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.loginBtnWrapper}
            >
              <LinearGradient
                colors={['#0A8442', '#035E2C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>
                      {t('loginButton', 'Login')}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#FFFFFF"
                      style={styles.loginArrowIcon}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* "or" Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or', 'or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Side-by-Side Language Pill Selector */}
            <View style={styles.languageRow}>
              <TouchableOpacity
                style={styles.languagePillWrapper}
                onPress={() => setLanguage('en')}
                activeOpacity={0.85}
              >
                {language === 'en' ? (
                  <LinearGradient
                    colors={['#0A8A45', '#046A38']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.languagePillActive}
                  >
                    <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.languagePillTextActive}>English</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.languagePillInactive}>
                    <Text style={styles.languagePillTextInactive}>English</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.languagePillWrapper}
                onPress={() => setLanguage('am')}
                activeOpacity={0.85}
              >
                {language === 'am' ? (
                  <LinearGradient
                    colors={['#0A8A45', '#046A38']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.languagePillActive}
                  >
                    <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.languagePillTextActive}>አማርኛ</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.languagePillInactive}>
                    <Text style={styles.languagePillTextInactive}>አማርኛ</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {!hasAdmin && (
              <TouchableOpacity
                style={styles.setupPrompt}
                onPress={() => router.push('/(auth)/setup' as any)}
              >
                <Text style={styles.setupPromptText}>
                  No admin account found?{' '}
                  <Text style={styles.setupPromptLink}>Setup First Admin</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#070D18',
  },
  backgroundImage: {
    position: 'absolute',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  formSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: colors.statRedIcon,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  inputSpacing: {
    marginBottom: 12,
  },
  passwordSpacing: {
    marginBottom: 16,
  },
  inputBox: {
    borderRadius: 14,
    borderColor: '#CBD5E1',
    borderWidth: 1.2,
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  loginBtnWrapper: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#046A38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnGradient: {
    height: 50,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  loginArrowIcon: {
    position: 'absolute',
    right: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  languagePillWrapper: {
    flex: 1,
  },
  languagePillActive: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  languagePillTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  languagePillInactive: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languagePillTextInactive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  setupPrompt: {
    marginTop: 14,
    alignItems: 'center',
  },
  setupPromptText: {
    color: '#475569',
    fontSize: 13,
  },
  setupPromptLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});
