import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { ConfirmationDialog } from '../../src/components/ConfirmationDialog';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import {
  exportDatabaseBackup,
  restoreDatabase,
  exportMembersCsv,
  exportPaymentsCsv,
  exportFinancialReportCsv,
} from '../../src/services/backupService';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { admin, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [busy, setBusy] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const handleBackup = async () => {
    setBusy(true);
    try {
      await exportDatabaseBackup();
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message || 'Failed to export backup');
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setShowRestoreDialog(false);
    setBusy(true);
    try {
      const result = await restoreDatabase();
      if (result.success) {
        Alert.alert(t('success', 'Success'), t('restoreSuccess', 'Database restored successfully!'));
      }
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message || 'Failed to restore database');
    } finally {
      setBusy(false);
    }
  };

  const handleExportMembers = async () => {
    setBusy(true);
    try {
      await exportMembersCsv();
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleExportPayments = async () => {
    setBusy(true);
    try {
      await exportPaymentsCsv();
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleExportReports = async () => {
    setBusy(true);
    try {
      await exportFinancialReportCsv('all');
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title={t('settingsTitle', 'Settings')}
        subtitle={admin?.full_name || 'Administrator'}
        dark={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {busy && (
          <View style={styles.busyOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.busyText}>{t('loading', 'Processing...')}</Text>
          </View>
        )}

        {/* Gym Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('gymInfo', 'Gym Information')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('gymNameLabel', 'Gym Name')}:</Text>
            <Text style={styles.infoValue}>DBU Gym</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Institution:</Text>
            <Text style={styles.infoValue}>Debre Berhan University</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>Debre Berhan, Ethiopia</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('contactPhoneLabel', 'Contact Phone')}:</Text>
            <Text style={styles.infoValue}>+251 91 234 5678</Text>
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('appLanguage', 'Application Language')}</Text>
          <View style={styles.languageToggleContainer}>
            <TouchableOpacity
              style={[
                styles.langOption,
                language === 'en' && styles.langOptionActive,
              ]}
              onPress={() => setLanguage('en')}
            >
              <Ionicons
                name={language === 'en' ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={language === 'en' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.langOptionText,
                  language === 'en' && styles.langOptionTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langOption,
                language === 'am' && styles.langOptionActive,
              ]}
              onPress={() => setLanguage('am')}
            >
              <Ionicons
                name={language === 'am' ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={language === 'am' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.langOptionText,
                  language === 'am' && styles.langOptionTextActive,
                ]}
              >
                አማርኛ (Amharic)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Membership Plans Configuration */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('membershipPlans', 'Membership Plans')}</Text>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/settings/plans' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconRing, { backgroundColor: colors.primaryUltralight }]}>
                <Ionicons name="pricetags" size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuTitle}>{t('managePlans', 'Manage Plans & Pricing')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Reports Navigation Shortcut */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reportsTitle', 'Financial Reports')}</Text>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/reports' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconRing, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="pie-chart" size={18} color="#2563EB" />
              </View>
              <Text style={styles.menuTitle}>View Reports & Charts</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Database Backup & Restore */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('backupRestore', 'Backup & Restore')}</Text>

          <TouchableOpacity style={styles.menuRow} onPress={handleBackup} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconRing, { backgroundColor: colors.primaryUltralight }]}>
                <Ionicons name="cloud-upload" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.menuTitle}>{t('databaseBackup', 'Export Database Backup')}</Text>
                <Text style={styles.menuSubtitle}>Complete offline SQLite .db file</Text>
              </View>
            </View>
            <Ionicons name="share-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setShowRestoreDialog(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconRing, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="cloud-download" size={18} color={colors.statRedIcon} />
              </View>
              <View>
                <Text style={styles.menuTitle}>{t('databaseRestore', 'Restore Database')}</Text>
                <Text style={styles.menuSubtitle}>With automated safety backup</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* CSV Data Export */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Data Export (CSV / Excel)</Text>

          <TouchableOpacity style={styles.menuRow} onPress={handleExportMembers} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconRing, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people" size={18} color="#2563EB" />
              </View>
              <Text style={styles.menuTitle}>Export All Members (CSV)</Text>
            </View>
            <Ionicons name="download-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={handleExportPayments} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconRing, { backgroundColor: colors.primaryUltralight }]}>
                <Ionicons name="card" size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuTitle}>Export All Payments (CSV)</Text>
            </View>
            <Ionicons name="download-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={handleExportReports} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconRing, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="document-text" size={18} color="#7C3AED" />
              </View>
              <Text style={styles.menuTitle}>Export Financial Summary (CSV)</Text>
            </View>
            <Ionicons name="download-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* About App */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('aboutApp', 'About Application')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App:</Text>
            <Text style={styles.infoValue}>DBU Gym Payment Tracker</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('version', 'Version')}:</Text>
            <Text style={styles.infoValue}>1.0.0 (Production)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Storage:</Text>
            <Text style={styles.infoValue}>Offline SQLite (Zero Cloud)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Target:</Text>
            <Text style={styles.infoValue}>Debre Berhan University</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutDialog(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.statRedIcon} />
          <Text style={styles.logoutBtnText}>{t('logout', 'Logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        visible={showLogoutDialog}
        title={t('logout', 'Logout')}
        message="Are you sure you want to log out from the administrator session?"
        confirmLabel={t('logout', 'Logout')}
        isDestructive={true}
        icon="log-out-outline"
        onConfirm={() => {
          setShowLogoutDialog(false);
          logout();
          router.replace('/(auth)/login' as any);
        }}
        onCancel={() => setShowLogoutDialog(false)}
      />

      <ConfirmationDialog
        visible={showRestoreDialog}
        title={t('databaseRestore', 'Restore Database')}
        message={t(
          'confirmRestore',
          'Are you sure you want to restore a database backup? Current records will be replaced. A safety backup will be created automatically before restore.'
        )}
        confirmLabel={t('confirm', 'Proceed')}
        isDestructive={true}
        icon="cloud-download-outline"
        onConfirm={handleRestore}
        onCancel={() => setShowRestoreDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  busyOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  busyText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  languageToggleContainer: {
    gap: 10,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
  },
  langOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryUltralight,
  },
  langOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 10,
  },
  langOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.statRedIcon,
    marginLeft: 8,
  },
});
