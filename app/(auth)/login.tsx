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
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { InputField, InputHandle } from '../../src/components/InputField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login, hasAdmin } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const usernameRef = useRef<InputHandle>(null);
  const passwordRef = useRef<InputHandle>(null);

  // Exact aspect ratio of BG.png is 572 / 1024
  // We pin top: 0 so the top logo and artwork are 100% visible and never cut off or hidden above
  const imgAspectRatio = 350/1050;
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

      {/* Pinned background image: top is strictly 0 so top artwork & logo is NEVER hidden above */}
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

      {/* Gradient overlay: 0% opacity at top (crystal clear view of the logo and header art), gently deepening towards bottom for card contrast */}
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
          {/* Dedicated top spacer showcasing the top logo & artwork in full glory */}
          <View style={{ height: Math.max(screenHeight * 0.32, 140) }} pointerEvents="none" />

          {/* Login Card moved down for proper bottom alignment */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('loginTitle', 'Administrator Login')}</Text>
            <Text style={styles.formSubtitle}>
              {t('loginSubtitle', 'Enter your credentials to access system')}
            </Text>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.statRedIcon} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <InputField
              ref={usernameRef}
              label={t('username', 'Username')}
              value={username}
              onChangeText={(txt) => {
                setUsername(txt);
                setErrorMessage('');
              }}
              placeholder="admin"
              icon="person-outline"
              autoCapitalize="none"
              required
              dark={true}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              style={styles.inputSpacing}
            />

            <InputField
              ref={passwordRef}
              label={t('password', 'Password / PIN')}
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                setErrorMessage('');
              }}
              placeholder="••••••••"
              secureTextEntry
              icon="lock-closed-outline"
              required
              dark={true}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              style={styles.inputSpacing}
            />

            <PrimaryButton
              title={t('loginButton', 'Login')}
              onPress={handleLogin}
              icon="log-in-outline"
              loading={loading}
              style={styles.loginBtn}
            />

            {/* Change Language Button */}
            <TouchableOpacity
              style={styles.languageBtn}
              onPress={toggleLanguage}
              activeOpacity={0.8}
            >
              <Ionicons name="globe-outline" size={18} color="#FFFFFF" style={styles.langIcon} />
              <Text style={styles.languageText}>
                {t('changeLanguage', 'Change Language')}{' '}
                <Text style={styles.langHighlight}>
                  {language === 'en' ? 'አማርኛ' : 'English'}
                </Text>
              </Text>
            </TouchableOpacity>

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
    backgroundColor: 'rgba(18, 30, 49, 0.92)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  formTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 18,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  inputSpacing: {
    marginBottom: 14,
  },
  loginBtn: {
    marginTop: 4,
    marginBottom: 12,
  },
  languageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  langIcon: {
    marginRight: 8,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  langHighlight: {
    color: colors.primaryVibrant,
    fontWeight: '700',
  },
  setupPrompt: {
    marginTop: 14,
    alignItems: 'center',
  },
  setupPromptText: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  setupPromptLink: {
    color: colors.primaryVibrant,
    fontWeight: '700',
  },
});
