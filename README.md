# DBU Gym Payment Tracker 🏋️‍♂️

A modern, professional, offline-first mobile application built with **React Native**, **Expo SDK 58**, **TypeScript**, and **Expo SQLite** for managing gym members, payments, renewals, and financial analytics at **Debre Berhan University (DBU)**, Ethiopia.

---

## 🌟 Key Features

- **100% Offline with Local SQLite Database**: Zero cloud dependency, no Firebase or external servers required. Works entirely standalone on Android devices.
- **Visual Design Identity**: Modeled closely after modern premium gym management UI with dark navy headers, athletic emerald green accents, rounded cards, and responsive layouts.
- **Member Category Management**:
  - **DBU Students**: Uses official student ID (e.g., `DBU-2024-001`), enforced for uniqueness.
  - **University Staff**: Auto-generates unique, monotonic Gym IDs (e.g., `STF-0001`, `STF-0002`).
  - **External Members**: Auto-generates unique, monotonic Gym IDs (e.g., `EXT-0001`, `EXT-0002`).
- **Instant Eligibility & Status Verification**:
  - **GREEN (PAID / ACTIVE)**: Valid paid membership active today.
  - **RED (EXPIRED)**: Most recent membership period has elapsed.
  - **ORANGE (UNPAID)**: Registered without an active payment plan.
  - **GRAY (INACTIVE)**: Deactivated by admin.
- **Smart Renewal Logic**:
  - Renewal before expiration **extends continuously** from the current expiry date.
  - Renewal after expiration starts fresh from the payment date.
  - Uses atomic SQLite transactions to ensure payment records and membership periods succeed or fail together.
- **Configurable Membership Plans**:
  - Customize plan names, durations (Weekly, Monthly, Quarterly, Annual), and prices in **Ethiopian Birr (ETB)**.
- **Auditable Payments & Reversal**:
  - Completed financial records are never silently deleted. A controlled reversal mechanism preserves the transaction history with an audit trail.
- **Receipt Generation & Printing**:
  - Generates branded DBU Gym receipts printable via thermal/regular printers or shareable as PDF documents.
- **Interactive Reports & Charts**:
  - Real-time income calculation (Today, This Month, Last Month, This Year, All Time).
  - SVG Donut Chart breakdown of active, expired, and unpaid members.
  - Category distribution metrics.
- **Complete Backup & Restore**:
  - Full `.db` SQLite backup export and restore with automatic safety snapshot before restore.
  - CSV exports for members, payments, and financial summaries.
- **Bilingual English & Amharic (አማርኛ)**:
  - Complete Amharic translation for all screens, navigation, badges, and receipts.
  - Fast one-tap language switcher on the login screen and settings screen with persistence.

---

## 🛠️ Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **React Native** (0.88.1) | Mobile framework |
| **Expo** (SDK 58) | Managed mobile platform |
| **TypeScript** | Type-safe development |
| **Expo Router** (v58) | File-based navigation & deep linking |
| **expo-sqlite** | Local ACID-compliant SQLite database |
| **expo-file-system / sharing** | Database backup, restore & CSV exports |
| **expo-document-picker** | Backup file selection |
| **expo-print** | PDF receipt generation and printing |
| **expo-crypto** | Secure password hashing (SHA-256 + salt) |
| **i18next & react-i18next** | Bilingual English & Amharic localization |
| **react-native-svg** | SVG charts and status donut visualization |

---

## 📁 Project Architecture

```
app/
  _layout.tsx             # Root layout: SQLite, Auth & Language providers
  (auth)/
    login.tsx             # Administrator login & language switcher
    setup.tsx             # First-time admin onboarding
  (tabs)/
    _layout.tsx           # Custom 4-tab bottom navigation
    index.tsx             # Real-time dashboard & quick search
    members.tsx           # Member listing, filters & search
    payments.tsx          # Fast payment verification screen
    settings.tsx          # Settings, backup/restore & exports
  members/
    register.tsx          # Student, Staff & External registration
    [id].tsx              # Member details & payment history
    edit.tsx              # Edit member information
    search.tsx            # Dedicated search
  payments/
    record.tsx            # Record payment with renewal calculation
    history.tsx           # Transactions list & reversal audit
    receipt.tsx           # Receipt viewer, print & PDF share
  reports/
    index.tsx             # Financial analytics & donut chart
  settings/
    plans.tsx             # Membership plan & pricing manager

src/
  components/             # CustomHeader, StatCard, StatusBadge, etc.
  database/               # schema.ts, db.ts
  services/               # memberService, paymentService, reportService, etc.
  context/                # AuthContext, LanguageContext
  theme/                  # colors.ts, typography, spacing
  i18n/                   # en.ts, am.ts (100% synchronized)
  types/                  # TypeScript interfaces
```

---

## 💾 SQLite Database Schema

The database is initialized at `dbu_gym.db` with `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;`.

- **`admins`**: `id`, `username`, `password_hash`, `full_name`, `role`, `created_at`
- **`members`**: `id`, `gym_id`, `full_name`, `member_type`, `institution_id`, `phone`, `gender`, `registration_date`, `is_active`, `created_at`, `updated_at`
- **`membership_plans`**: `id`, `plan_name`, `duration_days`, `price`, `member_category`, `is_active`, `created_at`
- **`memberships`**: `id`, `member_id`, `plan_id`, `start_date`, `end_date`, `status`, `created_at`
- **`payments`**: `id`, `membership_id`, `member_id`, `amount`, `payment_method`, `payment_date`, `receipt_number`, `notes`, `recorded_by`, `status`, `created_at`
- **`id_sequences`**: `category` (`staff`, `external`), `last_number` (guarantees monotonic sequence without reuse)
- **`audit_logs`**: `id`, `action`, `entity_type`, `entity_id`, `details`, `performed_by`, `created_at`
- **`settings`**: `setting_key`, `setting_value`

---

## 🚀 Installation & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Run TypeScript Check
```bash
npm run typecheck
```

### 3. Start Expo Dev Server
```bash
npx expo start
```
- Press `a` in the terminal to launch on a connected Android phone or Android Studio emulator.
- Scan the QR code using the **Expo Go** app on your Android device.

---

## 📱 Building Android Standalone APK

To build a standalone installable Android APK (`.apk` file):

### Using EAS Build (Cloud / Recommended)
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Log in to your Expo account
eas login

# 3. Build standalone APK
eas build -p android --profile preview
```
Once the build completes, download the APK link from your Expo dashboard and install directly onto any Android device.

### Local Gradle Build
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```
The generated APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 🔄 Backup and Restore Guide

### Exporting Backup:
1. Open the app and navigate to **Settings** (`ቅንብሮች`).
2. Tap **Export Database Backup** (`የመረጃ ቋት ምትኬ ውሰድ`).
3. Choose where to save or share the `.db` file (Google Drive, Telegram, Bluetooth, local SD card, USB).

### Restoring Backup:
1. In **Settings**, tap **Restore Database** (`የመረጃ ቋት መልስ`).
2. Confirm the safety prompt.
3. Select the `.db` backup file using the system document picker.
4. The system validates the database, creates an automatic fallback safety backup of the active database, and replaces the database file.

---

## 🏛️ Debre Berhan University (DBU) Gym Management
*Stronger Together* • Debre Berhan, Amhara, Ethiopia.
# GYM-PAY
