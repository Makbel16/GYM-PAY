import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { LoadingIndicator } from '../../src/components/LoadingIndicator';
import { Payment } from '../../src/types';
import { getPaymentById } from '../../src/services/paymentService';

export default function PaymentReceiptScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ paymentId: string }>();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  const paymentId = Number(params.paymentId);

  useEffect(() => {
    async function load() {
      if (!paymentId) return;
      try {
        const data = await getPaymentById(paymentId);
        setPayment(data);
      } catch (e) {
        console.error('Failed to load payment', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [paymentId]);

  const generateReceiptHtml = (p: Payment) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 24px; color: #0F172A; }
            .header { text-align: center; border-bottom: 2px dashed #CBD5E1; padding-bottom: 16px; margin-bottom: 20px; }
            .gym-title { font-size: 24px; font-weight: bold; color: #059669; }
            .uni-title { font-size: 14px; color: #64748B; margin-top: 4px; }
            .receipt-badge { display: inline-block; background-color: #ECFDF5; color: #059669; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px; margin-top: 8px; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .info-table td { padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
            .label { color: #64748B; }
            .value { text-align: right; font-weight: bold; color: #0F172A; }
            .total-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }
            .total-label { font-size: 13px; color: #64748B; }
            .total-amount { font-size: 28px; font-weight: 800; color: #059669; margin-top: 4px; }
            .footer { text-align: center; font-size: 12px; color: #94A3B8; margin-top: 30px; border-top: 1px dashed #CBD5E1; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="gym-title">DBU GYM PAYMENT TRACKER</div>
            <div class="uni-title">Debre Berhan University • Gym Management</div>
            <div class="receipt-badge">OFFICIAL PAYMENT RECEIPT</div>
          </div>

          <div class="total-box">
            <div class="total-label">AMOUNT PAID</div>
            <div class="total-amount">${p.amount} ETB</div>
            <div style="font-size: 12px; color: #059669; font-weight: bold; margin-top: 4px;">PAID & VERIFIED</div>
          </div>

          <table class="info-table">
            <tr>
              <td class="label">Receipt Number:</td>
              <td class="value">${p.receipt_number || `REC-${p.id}`}</td>
            </tr>
            <tr>
              <td class="label">Payment Date:</td>
              <td class="value">${p.payment_date}</td>
            </tr>
            <tr>
              <td class="label">Member Name:</td>
              <td class="value">${p.member_name || ''}</td>
            </tr>
            <tr>
              <td class="label">Gym ID / Student ID:</td>
              <td class="value">${p.gym_id || ''}</td>
            </tr>
            <tr>
              <td class="label">Member Category:</td>
              <td class="value">${(p.member_type || '').toUpperCase()}</td>
            </tr>
            <tr>
              <td class="label">Membership Plan:</td>
              <td class="value">${p.plan_name || 'Standard'}</td>
            </tr>
            <tr>
              <td class="label">Validity Period:</td>
              <td class="value">${p.start_date || ''} to ${p.end_date || ''}</td>
            </tr>
            <tr>
              <td class="label">Payment Method:</td>
              <td class="value">${p.payment_method.toUpperCase()}</td>
            </tr>
            <tr>
              <td class="label">Recorded By:</td>
              <td class="value">${p.recorded_by}</td>
            </tr>
          </table>

          <div class="footer">
            Thank you for training with DBU Gym!<br/>
            Debre Berhan University, Ethiopia • Stronger Together
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    if (!payment) return;
    setPrinting(true);
    try {
      const html = generateReceiptHtml(payment);
      await Print.printAsync({ html });
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message || 'Failed to print receipt');
    } finally {
      setPrinting(false);
    }
  };

  const handleSharePdf = async () => {
    if (!payment) return;
    setPrinting(true);
    try {
      const html = generateReceiptHtml(payment);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `DBU Gym Receipt #${payment.receipt_number || payment.id}`,
        });
      }
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message || 'Failed to export PDF');
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Payment Receipt" showBack={true} />
        <LoadingIndicator />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Payment Receipt" showBack={true} />
        <View style={styles.notFound}>
          <Text>Receipt not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Payment Receipt" showBack={true} dark={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Physical Paper Style Receipt Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptTopBorder} />

          <View style={styles.receiptHeader}>
            <View style={styles.badgeRing}>
              <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
            </View>
            <Text style={styles.gymTitle}>DBU GYM</Text>
            <Text style={styles.uniSubtitle}>Debre Berhan University</Text>
            <View style={styles.receiptTag}>
              <Text style={styles.receiptTagText}>OFFICIAL RECEIPT</Text>
            </View>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>AMOUNT PAID</Text>
            <Text style={styles.amountNumber}>{payment.amount} ETB</Text>
            <Text style={styles.statusLabel}>
              {payment.status === 'completed' ? 'PAID & VERIFIED' : 'REVERSED'}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Receipt No:</Text>
              <Text style={styles.value}>{payment.receipt_number || `REC-${payment.id}`}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Payment Date:</Text>
              <Text style={styles.value}>{payment.payment_date}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Member Name:</Text>
              <Text style={styles.value}>{payment.member_name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Gym ID:</Text>
              <Text style={styles.value}>{payment.gym_id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Plan:</Text>
              <Text style={styles.value}>{payment.plan_name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Validity Period:</Text>
              <Text style={styles.value}>
                {payment.start_date} to {payment.end_date}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Payment Method:</Text>
              <Text style={styles.value}>{payment.payment_method.toUpperCase()}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Cashier / Admin:</Text>
              <Text style={styles.value}>{payment.recorded_by}</Text>
            </View>
          </View>

          <View style={styles.receiptFooter}>
            <Text style={styles.footerNote}>
              Debre Berhan University Gym Management System
            </Text>
            <Text style={styles.footerSlogan}>Stronger Together</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.printBtn}
            onPress={handlePrint}
            disabled={printing}
            activeOpacity={0.8}
          >
            <Ionicons name="print-outline" size={18} color="#FFFFFF" />
            <Text style={styles.printBtnText}>{t('printReceipt', 'Print Receipt')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleSharePdf}
            disabled={printing}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.shareBtnText}>{t('exportReceipt', 'Share / PDF')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  receiptTopBorder: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginBottom: 16,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeRing: {
    marginBottom: 8,
  },
  gymTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  uniSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  receiptTag: {
    backgroundColor: colors.primaryUltralight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  receiptTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  amountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  amountNumber: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  infoSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  receiptFooter: {
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footerSlogan: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  printBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 8,
  },
});
