import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { DB_NAME } from '../database/schema';
import { getAllMembers } from './memberService';
import { getAllPayments } from './paymentService';
import { getReportSummary } from './reportService';
import { getTodayString } from './membershipService';

const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

export async function exportDatabaseBackup(): Promise<{ success: boolean; filePath: string }> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(DB_PATH);
    if (!fileInfo.exists) {
      throw new Error('Database file does not exist yet. Please record some data first.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `DBU_Gym_Backup_${timestamp}.db`;
    const backupPath = `${FileSystem.cacheDirectory}${backupFileName}`;

    await FileSystem.copyAsync({
      from: DB_PATH,
      to: backupPath,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(backupPath, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Export DBU Gym SQLite Database',
        UTI: 'public.database',
      });
    }

    return { success: true, filePath: backupPath };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to export database backup');
  }
}

export async function restoreDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, message: 'Restore cancelled by user' };
    }

    const pickedFile = result.assets[0];
    const pickedUri = pickedFile.uri;

    // Safety backup of current database
    const currentDbInfo = await FileSystem.getInfoAsync(DB_PATH);
    if (currentDbInfo.exists) {
      const safetyBackupPath = `${FileSystem.documentDirectory}SQLite/dbu_gym_safety_pre_restore.db`;
      await FileSystem.copyAsync({
        from: DB_PATH,
        to: safetyBackupPath,
      });
    } else {
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, {
          intermediates: true,
        });
      }
    }

    // Overwrite database with the restored backup file
    await FileSystem.copyAsync({
      from: pickedUri,
      to: DB_PATH,
    });

    return {
      success: true,
      message: 'Database restored successfully! Please restart the app if necessary.',
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to restore database');
  }
}

export async function exportMembersCsv(): Promise<void> {
  const members = await getAllMembers();
  const rows: string[] = [
    ['Gym ID', 'Full Name', 'Category', 'University ID', 'Phone', 'Status', 'Current Plan', 'Valid Until', 'Registration Date'].join(','),
  ];

  for (const m of members) {
    const row = [
      `"${m.gym_id}"`,
      `"${m.full_name.replace(/"/g, '""')}"`,
      `"${m.member_type}"`,
      `"${m.institution_id || ''}"`,
      `"${m.phone}"`,
      `"${m.status.toUpperCase()}"`,
      `"${m.current_plan_name || 'None'}"`,
      `"${m.membership_end_date || 'N/A'}"`,
      `"${m.registration_date}"`,
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\n');
  const filename = `DBU_Gym_Members_${getTodayString()}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Members CSV',
    });
  }
}

export async function exportPaymentsCsv(): Promise<void> {
  const payments = await getAllPayments(1000);
  const rows: string[] = [
    ['Payment ID', 'Receipt Number', 'Date', 'Gym ID', 'Member Name', 'Category', 'Plan Name', 'Amount (ETB)', 'Payment Method', 'Membership Start', 'Membership End', 'Status', 'Recorded By'].join(','),
  ];

  for (const p of payments) {
    const row = [
      p.id,
      `"${p.receipt_number || ''}"`,
      `"${p.payment_date}"`,
      `"${p.gym_id || ''}"`,
      `"${(p.member_name || '').replace(/"/g, '""')}"`,
      `"${p.member_type || ''}"`,
      `"${p.plan_name || ''}"`,
      p.amount,
      `"${p.payment_method}"`,
      `"${p.start_date || ''}"`,
      `"${p.end_date || ''}"`,
      `"${p.status.toUpperCase()}"`,
      `"${p.recorded_by}"`,
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\n');
  const filename = `DBU_Gym_Payments_${getTodayString()}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Payments CSV',
    });
  }
}

export async function exportFinancialReportCsv(
  period: 'today' | 'month' | 'last_month' | 'year' | 'all'
): Promise<void> {
  const report = await getReportSummary(period);
  const rows: string[] = [];

  rows.push('--- DBU GYM FINANCIAL & MEMBERSHIP REPORT ---');
  rows.push(`Report Period,${period.toUpperCase()}`);
  rows.push(`Generated Date,${getTodayString()}`);
  rows.push(`Total Income (ETB),${report.total_income}`);
  rows.push(`Total Payments Count,${report.payment_count}`);
  rows.push('');
  rows.push('--- MEMBERSHIP SUMMARY ---');
  rows.push(`Active Members,${report.active_count}`);
  rows.push(`Expired Members,${report.expired_count}`);
  rows.push(`Unpaid Members,${report.unpaid_count}`);
  rows.push(`Students,${report.student_count}`);
  rows.push(`Staff,${report.staff_count}`);
  rows.push(`External,${report.external_count}`);
  rows.push('');
  rows.push('--- PAYMENT DETAILS ---');
  rows.push(['Receipt No', 'Date', 'Gym ID', 'Member Name', 'Plan', 'Amount (ETB)', 'Method', 'Valid Until'].join(','));

  for (const p of report.payments) {
    const row = [
      `"${p.receipt_number || ''}"`,
      `"${p.payment_date}"`,
      `"${p.gym_id || ''}"`,
      `"${(p.member_name || '').replace(/"/g, '""')}"`,
      `"${p.plan_name || ''}"`,
      p.amount,
      `"${p.payment_method}"`,
      `"${p.end_date || ''}"`,
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\n');
  const filename = `DBU_Gym_Report_${period}_${getTodayString()}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Financial Report CSV',
    });
  }
}
