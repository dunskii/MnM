# Phase 3: Internationalization (i18n)
**Multi-Language Support for Global Expansion**

---

## Executive Summary

**Requirement:** Support multiple languages for Music 'n Me's expansion into Asian and global markets.

**Approach:** WordPress-style translation system with language packs and translation files.

**Target Markets:**
- **Primary:** Australia, Singapore, Malaysia, Hong Kong, Indonesia, Thailand, Japan, South Korea
- **Secondary:** Philippines, Vietnam, Taiwan, India

**Timeline:** 2-3 weeks (integrated into Phase 3B or 3C)

**Languages (Phase 3):**
- English (en-US, en-AU, en-GB)
- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)
- Japanese (ja-JP)
- Korean (ko-KR)
- Thai (th-TH)
- Indonesian (id-ID)
- Malay (ms-MY)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Translation System Design](#translation-system-design)
3. [Database Schema](#database-schema)
4. [Translation File Format](#translation-file-format)
5. [Frontend Implementation](#frontend-implementation)
6. [Backend Implementation](#backend-implementation)
7. [Content Types](#content-types)
8. [Language Switching](#language-switching)
9. [Translation Workflow](#translation-workflow)
10. [Localization (l10n)](#localization-l10n)
11. [RTL Support](#rtl-support)
12. [API Endpoints](#api-endpoints)
13. [Implementation Phases](#implementation-phases)
14. [Best Practices](#best-practices)

---

## Architecture Overview

### WordPress-Style Translation Approach

WordPress uses `.po` (Portable Object) and `.mo` (Machine Object) files, but for modern JavaScript/TypeScript applications, we'll use **JSON-based translation files** which are more performant and easier to work with.

### How It Works

```
1. Developer writes code with translation keys:
   t('dashboard.welcome', 'Welcome to {schoolName}!')

2. Translation files contain translations:
   {
     "dashboard.welcome": "Welcome to {schoolName}!"  // English
     "dashboard.welcome": "欢迎来到{schoolName}！"      // Chinese
   }

3. System loads correct translation based on user's language preference

4. Missing translations fall back to English (default)
```

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│  Language Selector → User chooses language                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  react-i18next                                               │
│  - Loads translation JSON files                              │
│  - Handles interpolation: {schoolName}                       │
│  - Detects user language                                     │
│  - Caches translations                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                         │
│  i18next                                                     │
│  - Loads translation JSON files                              │
│  - Translates emails, PDFs, notifications                    │
│  - API responses in user's language                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  TRANSLATION FILES                           │
│  /locales/                                                   │
│    en-US/                                                    │
│      common.json                                             │
│      dashboard.json                                          │
│      lessons.json                                            │
│    zh-CN/                                                    │
│      common.json                                             │
│      dashboard.json                                          │
│      lessons.json                                            │
│    ...                                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Translation System Design

### Translation Libraries

**Frontend:** `react-i18next` + `i18next`
**Backend:** `i18next` + `i18next-fs-backend`

### Translation Key Structure

Use **namespaced keys** for organization:

```typescript
// Format: namespace.section.key
t('common.buttons.save')           // "Save"
t('common.buttons.cancel')         // "Cancel"
t('dashboard.welcome', { name })   // "Welcome, {name}!"
t('lessons.types.group')           // "Group Lesson"
t('lessons.types.individual')      // "Individual Lesson"
t('lessons.types.hybrid')          // "Hybrid Lesson"
t('invoices.status.paid')          // "Paid"
t('invoices.status.overdue')       // "Overdue"
```

**Namespaces:**
- `common` - Buttons, labels, common phrases
- `dashboard` - Dashboard-specific text
- `lessons` - Lesson management
- `students` - Student management
- `invoices` - Invoicing system
- `payments` - Payment system
- `attendance` - Attendance tracking
- `notifications` - Notification messages
- `emails` - Email templates
- `errors` - Error messages
- `validation` - Form validation messages

### Interpolation & Pluralization

```typescript
// Simple interpolation
t('welcome.message', { name: 'Sarah' })
// → "Welcome, Sarah!"

// Pluralization
t('students.count', { count: 1 })   // "1 student"
t('students.count', { count: 5 })   // "5 students"

// With context
t('action.delete', { context: 'lesson' })  // "Delete Lesson"
t('action.delete', { context: 'student' }) // "Delete Student"

// Date formatting
t('lessons.scheduled', { date: new Date() })
// → "Scheduled for January 15, 2025"
```

---

## Database Schema

### Language Preference Storage

```prisma
model User {
  // ... existing fields

  // Language preference
  language    String   @default("en-US")  // ISO 639-1 + ISO 3166-1
  timezone    String   @default("Australia/Sydney")

  // ... existing relations
}

model School {
  // ... existing fields

  // Default language for school
  defaultLanguage String   @default("en-US")

  // Supported languages (array)
  supportedLanguages Json   @default("[\\"en-US\\"]")

  // ... existing relations
}

// For user-generated content that needs translation
model Translation {
  id        String   @id @default(cuid())

  // What is being translated
  entityType String   // "LESSON", "TERM", "INSTRUMENT"
  entityId   String
  field      String   // "title", "description"

  // Translation
  language   String   // "zh-CN"
  value      String   @db.Text

  // Metadata
  translatedBy String?  // userId of translator
  translatedAt DateTime @default(now())
  verified     Boolean  @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([entityType, entityId, field, language])
  @@index([entityType, entityId])
  @@index([language])
}

// Translation metadata (for analytics)
model LanguageUsage {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id])

  language  String
  date      DateTime @default(now())

  // Usage counts
  activeUsers    Int  @default(0)
  pageViews      Int  @default(0)

  createdAt DateTime @default(now())

  @@unique([schoolId, language, date])
  @@index([schoolId])
  @@index([language])
}
```

---

## Translation File Format

### File Structure

```
apps/
  frontend/
    public/
      locales/
        en-US/
          common.json
          dashboard.json
          lessons.json
          students.json
          invoices.json
          payments.json
          attendance.json
          notifications.json
          errors.json
          validation.json
        zh-CN/
          common.json
          dashboard.json
          ...
        ja-JP/
          ...
  backend/
    locales/
      en-US/
        emails.json
        notifications.json
        invoices.json
      zh-CN/
        ...
```

### Example Translation Files

#### `locales/en-US/common.json`

```json
{
  "app": {
    "name": "Music 'n Me",
    "tagline": "Complete platform for music schools"
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "create": "Create",
    "update": "Update",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "submit": "Submit",
    "close": "Close",
    "confirm": "Confirm",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "import": "Import",
    "download": "Download",
    "upload": "Upload"
  },
  "labels": {
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
    "address": "Address",
    "date": "Date",
    "time": "Time",
    "status": "Status",
    "actions": "Actions",
    "description": "Description",
    "notes": "Notes"
  },
  "messages": {
    "success": "Success!",
    "error": "An error occurred",
    "loading": "Loading...",
    "noData": "No data available",
    "confirmDelete": "Are you sure you want to delete this?",
    "unsavedChanges": "You have unsaved changes. Are you sure you want to leave?"
  },
  "time": {
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow",
    "thisWeek": "This Week",
    "thisMonth": "This Month",
    "thisYear": "This Year"
  }
}
```

#### `locales/en-US/dashboard.json`

```json
{
  "welcome": "Welcome, {{name}}!",
  "overview": "Overview",
  "stats": {
    "students": "Students",
    "teachers": "Teachers",
    "lessons": "Lessons",
    "revenue": "Revenue",
    "attendance": "Attendance Rate"
  },
  "upcomingLessons": "Upcoming Lessons",
  "recentActivity": "Recent Activity",
  "quickActions": "Quick Actions",
  "notifications": "Notifications"
}
```

#### `locales/en-US/lessons.json`

```json
{
  "title": "Lessons",
  "createLesson": "Create Lesson",
  "editLesson": "Edit Lesson",
  "deleteLesson": "Delete Lesson",
  "lessonDetails": "Lesson Details",
  "types": {
    "individual": "Individual Lesson",
    "group": "Group Lesson",
    "hybrid": "Hybrid Lesson",
    "band": "Band Rehearsal"
  },
  "form": {
    "title": "Lesson Title",
    "type": "Lesson Type",
    "instructor": "Instructor",
    "location": "Location",
    "room": "Room",
    "startTime": "Start Time",
    "duration": "Duration",
    "maxStudents": "Maximum Students",
    "price": "Price"
  },
  "status": {
    "scheduled": "Scheduled",
    "inProgress": "In Progress",
    "completed": "Completed",
    "cancelled": "Cancelled"
  },
  "hybrid": {
    "title": "Hybrid Lesson Configuration",
    "cycleLength": "Cycle Length",
    "weekPattern": "Week Pattern",
    "groupWeek": "Group Week",
    "individualWeek": "Individual Week",
    "bookingsOpen": "Bookings Open",
    "bookingsClosed": "Bookings Closed"
  },
  "messages": {
    "created": "Lesson created successfully",
    "updated": "Lesson updated successfully",
    "deleted": "Lesson deleted successfully",
    "error": "Failed to save lesson"
  }
}
```

#### `locales/zh-CN/common.json` (Simplified Chinese)

```json
{
  "app": {
    "name": "Music 'n Me",
    "tagline": "音乐学校综合管理平台"
  },
  "buttons": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "add": "添加",
    "create": "创建",
    "update": "更新",
    "back": "返回",
    "next": "下一步",
    "previous": "上一步",
    "submit": "提交",
    "close": "关闭",
    "confirm": "确认",
    "search": "搜索",
    "filter": "筛选",
    "export": "导出",
    "import": "导入",
    "download": "下载",
    "upload": "上传"
  },
  "labels": {
    "name": "姓名",
    "email": "电子邮件",
    "phone": "电话",
    "address": "地址",
    "date": "日期",
    "time": "时间",
    "status": "状态",
    "actions": "操作",
    "description": "描述",
    "notes": "备注"
  },
  "messages": {
    "success": "成功！",
    "error": "发生错误",
    "loading": "加载中...",
    "noData": "暂无数据",
    "confirmDelete": "确定要删除吗？",
    "unsavedChanges": "您有未保存的更改。确定要离开吗？"
  }
}
```

#### `locales/ja-JP/common.json` (Japanese)

```json
{
  "app": {
    "name": "Music 'n Me",
    "tagline": "音楽教室の総合管理プラットフォーム"
  },
  "buttons": {
    "save": "保存",
    "cancel": "キャンセル",
    "delete": "削除",
    "edit": "編集",
    "add": "追加",
    "create": "作成",
    "update": "更新",
    "back": "戻る",
    "next": "次へ",
    "previous": "前へ",
    "submit": "送信",
    "close": "閉じる",
    "confirm": "確認",
    "search": "検索",
    "filter": "フィルター",
    "export": "エクスポート",
    "import": "インポート",
    "download": "ダウンロード",
    "upload": "アップロード"
  }
}
```

### Pluralization Examples

```json
// locales/en-US/students.json
{
  "count": "{{count}} student",
  "count_plural": "{{count}} students"
}

// locales/zh-CN/students.json
{
  "count": "{{count}} 名学生"
  // Chinese doesn't have plural forms
}

// locales/ja-JP/students.json
{
  "count": "{{count}} 人の生徒"
  // Japanese doesn't have plural forms
}
```

---

## Frontend Implementation

### Setup i18next

```bash
npm install i18next react-i18next i18next-http-backend i18next-browser-languagedetector
```

### Configure i18next

```typescript
// apps/frontend/src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'lessons', 'students', 'invoices', 'payments', 'attendance', 'notifications', 'errors', 'validation'],

    interpolation: {
      escapeValue: false, // React already escapes
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
```

### Initialize in App

```typescript
// apps/frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n/config'; // ← Initialize i18n

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Usage in Components

```typescript
// apps/frontend/src/components/Dashboard.tsx
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const user = useUser();

  return (
    <div>
      <h1>{t('dashboard:welcome', { name: user.firstName })}</h1>

      <button>{t('common:buttons.save')}</button>
      <button>{t('common:buttons.cancel')}</button>

      <div>
        {t('dashboard:stats.students')}: {studentCount}
      </div>
    </div>
  );
}
```

### Language Selector Component

```typescript
// apps/frontend/src/components/LanguageSelector.tsx
import { useTranslation } from 'react-i18next';
import { MenuItem, Select } from '@mui/material';

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-AU', name: 'English (Australia)', flag: '🇦🇺' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'th-TH', name: 'ไทย', flag: '🇹🇭' },
  { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms-MY', name: 'Bahasa Melayu', flag: '🇲🇾' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);

    // Save to user preferences
    await api.patch('/users/me/preferences', {
      language: languageCode
    });

    // Reload page to apply changes
    window.location.reload();
  };

  return (
    <Select
      value={i18n.language}
      onChange={(e) => handleChange(e.target.value)}
    >
      {LANGUAGES.map((lang) => (
        <MenuItem key={lang.code} value={lang.code}>
          <span style={{ marginRight: 8 }}>{lang.flag}</span>
          {lang.name}
        </MenuItem>
      ))}
    </Select>
  );
}
```

### Material-UI Localization

```typescript
// apps/frontend/src/App.tsx
import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS, zhCN, ja, ko, th } from '@mui/material/locale';
import { enUS as dateEnUS, zhCN as dateZhCN, ja as dateJa, ko as dateKo, th as dateTh } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const MUI_LOCALES = {
  'en-US': enUS,
  'en-AU': enUS,
  'zh-CN': zhCN,
  'zh-TW': zhCN,
  'ja-JP': ja,
  'ko-KR': ko,
  'th-TH': th,
};

const DATE_LOCALES = {
  'en-US': dateEnUS,
  'en-AU': dateEnUS,
  'zh-CN': dateZhCN,
  'zh-TW': dateZhCN,
  'ja-JP': dateJa,
  'ko-KR': dateKo,
  'th-TH': dateTh,
};

export function App() {
  const { i18n } = useTranslation();

  const theme = createTheme(
    {
      palette: { /* ... */ },
    },
    MUI_LOCALES[i18n.language] || enUS
  );

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={DATE_LOCALES[i18n.language] || dateEnUS}
      >
        {/* Your app */}
      </LocalizationProvider>
    </ThemeProvider>
  );
}
```

---

## Backend Implementation

### Setup i18next (Backend)

```bash
npm install i18next i18next-fs-backend i18next-http-middleware
```

### Configure i18next (Backend)

```typescript
// apps/backend/src/i18n/config.ts
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

i18next
  .use(Backend)
  .init({
    lng: 'en-US',
    fallbackLng: 'en-US',
    ns: ['emails', 'notifications', 'invoices', 'errors'],
    defaultNS: 'common',

    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
```

### Middleware for Request Language

```typescript
// apps/backend/src/middleware/language.middleware.ts
import { Request, Response, NextFunction } from 'express';
import i18next from '../i18n/config';

export interface LocalizedRequest extends Request {
  t: typeof i18next.t;
  language: string;
}

export function languageMiddleware(
  req: LocalizedRequest,
  res: Response,
  next: NextFunction
) {
  // Get language from:
  // 1. Query parameter: ?lang=zh-CN
  // 2. Header: Accept-Language
  // 3. User preference (if authenticated)
  // 4. School default language
  // 5. Fallback to en-US

  let language = req.query.lang as string;

  if (!language && req.headers['accept-language']) {
    language = req.headers['accept-language'].split(',')[0];
  }

  if (!language && req.user) {
    language = req.user.language || 'en-US';
  }

  if (!language && req.school) {
    language = req.school.defaultLanguage || 'en-US';
  }

  language = language || 'en-US';

  // Create translation function for this request
  req.t = i18next.getFixedT(language);
  req.language = language;

  next();
}
```

### Email Translation

```typescript
// apps/backend/src/services/email.service.ts
import i18next from '../i18n/config';
import sendgrid from '@sendgrid/mail';

export async function sendTranslatedEmail(
  to: string,
  templateKey: string,
  data: Record<string, any>,
  language: string = 'en-US'
) {
  const t = i18next.getFixedT(language, 'emails');

  const subject = t(`${templateKey}.subject`, data);
  const body = t(`${templateKey}.body`, data);

  await sendgrid.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    html: body,
  });
}

// Usage
await sendTranslatedEmail(
  parent.email,
  'hybridBookingOpen',
  {
    lessonTitle: 'Piano Foundation 1',
    schoolName: 'Parkside Music',
    bookingUrl: 'https://...'
  },
  parent.language
);
```

### Email Template Example

```json
// locales/en-US/emails.json
{
  "hybridBookingOpen": {
    "subject": "Booking now open for {{lessonTitle}}",
    "body": "<html><body><h1>Hi {{parentName}},</h1><p>Booking is now open for <strong>{{lessonTitle}}</strong> individual sessions.</p><p>Please log in to book your preferred times.</p><a href=\"{{bookingUrl}}\">Book Now</a><p>Thanks,<br>{{schoolName}}</p></body></html>"
  },
  "paymentReceived": {
    "subject": "Payment received - Invoice {{invoiceNumber}}",
    "body": "<html><body><h1>Thank you!</h1><p>We have received your payment of <strong>{{amount}}</strong> for invoice {{invoiceNumber}}.</p><p>Your receipt is attached.</p><p>Thanks,<br>{{schoolName}}</p></body></html>"
  }
}

// locales/zh-CN/emails.json
{
  "hybridBookingOpen": {
    "subject": "{{lessonTitle}}现已开放预约",
    "body": "<html><body><h1>{{parentName}}您好，</h1><p><strong>{{lessonTitle}}</strong>的一对一课程现已开放预约。</p><p>请登录选择您的上课时间。</p><a href=\"{{bookingUrl}}\">立即预约</a><p>{{schoolName}}敬上</p></body></html>"
  },
  "paymentReceived": {
    "subject": "已收到付款 - 发票编号{{invoiceNumber}}",
    "body": "<html><body><h1>感谢您！</h1><p>我们已收到您为发票{{invoiceNumber}}支付的<strong>{{amount}}</strong>。</p><p>收据已附上。</p><p>{{schoolName}}敬上</p></body></html>"
  }
}
```

### Notification Translation

```typescript
// apps/backend/src/services/notification.service.ts
export async function sendNotification(
  userId: string,
  messageKey: string,
  data: Record<string, any>
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPrefs: true }
  });

  if (!user) return;

  const t = i18next.getFixedT(user.language, 'notifications');
  const message = t(messageKey, data);

  // Send via preferred channel
  if (user.notificationPrefs.whatsappEnabled) {
    await twilioService.sendWhatsApp(user.notificationPrefs.whatsappPhone, message);
  } else if (user.notificationPrefs.smsEnabled) {
    await twilioService.sendSMS(user.notificationPrefs.smsPhone, message);
  } else {
    await sendEmail(user.email, message);
  }
}

// Usage
await sendNotification(
  parentId,
  'lessonRescheduled',
  {
    lessonTitle: 'Piano Foundation 1',
    oldDate: 'Monday, Jan 15',
    newDate: 'Tuesday, Jan 16'
  }
);
```

---

## Content Types

### System Text (Fully Translated)

**What:** UI labels, buttons, messages, error text

**How:** Translation files (JSON)

**Examples:**
- Button labels: "Save", "Cancel", "Delete"
- Navigation: "Dashboard", "Lessons", "Students"
- Status labels: "Active", "Pending", "Completed"
- Error messages: "Invalid email address"

**Translation Coverage:** 100%

### User-Generated Content (Optional Translation)

**What:** School-specific content created by admins

**Examples:**
- Lesson titles: "Piano Foundation 1"
- Lesson descriptions
- School term names: "Term 1 2025"
- Location names: "Main Studio"
- Custom instruments

**Translation Strategy:**

**Option 1: No Translation (Default)**
- Schools create content in their primary language
- Content displays as-is for all users
- Simpler, faster implementation

**Option 2: Optional Translation**
- Schools can provide translations for key content
- Falls back to original if translation missing
- Stored in `Translation` table

**Implementation:**

```typescript
export async function getLocalizedLesson(
  lessonId: string,
  language: string
): Promise<Lesson> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId }
  });

  if (!lesson) throw new Error('Lesson not found');

  // Check if translation exists
  const titleTranslation = await prisma.translation.findUnique({
    where: {
      entityType_entityId_field_language: {
        entityType: 'LESSON',
        entityId: lessonId,
        field: 'title',
        language
      }
    }
  });

  const descTranslation = await prisma.translation.findUnique({
    where: {
      entityType_entityId_field_language: {
        entityType: 'LESSON',
        entityId: lessonId,
        field: 'description',
        language
      }
    }
  });

  return {
    ...lesson,
    title: titleTranslation?.value || lesson.title,
    description: descTranslation?.value || lesson.description
  };
}
```

### Mixed Content

Some content requires both:

**Invoice PDF:**
- System text (translated): "Invoice", "Due Date", "Total"
- User content (original): Lesson names, school name, line item descriptions

**Email Notifications:**
- Subject line (translated): "Payment received"
- Body template (translated): "Thank you for your payment of..."
- Dynamic content (original): School name, lesson titles

---

## Language Switching

### Frontend Language Switching

```typescript
// Option 1: Dropdown in header
<LanguageSelector />

// Option 2: User settings page
<UserSettings>
  <Select
    label={t('settings.language')}
    value={user.language}
    onChange={handleLanguageChange}
  >
    {LANGUAGES.map(lang => (
      <option value={lang.code}>{lang.name}</option>
    ))}
  </Select>
</UserSettings>

// Option 3: First-time login prompt
<OnboardingDialog>
  <h2>{t('onboarding.selectLanguage')}</h2>
  <LanguageSelector />
</OnboardingDialog>
```

### Backend Language Detection

```typescript
// Priority order:
1. Query parameter: ?lang=zh-CN
2. User preference: user.language
3. School default: school.defaultLanguage
4. Accept-Language header
5. Fallback: en-US

// Implementation
export function detectLanguage(req: LocalizedRequest): string {
  return (
    req.query.lang ||
    req.user?.language ||
    req.school?.defaultLanguage ||
    req.headers['accept-language']?.split(',')[0] ||
    'en-US'
  );
}
```

### School-Level Language Configuration

```typescript
// Admin can set default language for school
PATCH /api/v1/schools/:id
{
  "defaultLanguage": "zh-CN",
  "supportedLanguages": ["zh-CN", "en-US", "zh-TW"]
}

// When new users join, they default to school's language
// Can still change in their personal settings
```

---

## Localization (l10n)

### Date & Time Formatting

```typescript
import { format } from 'date-fns';
import { enUS, zhCN, ja, ko, th } from 'date-fns/locale';

const LOCALE_MAP = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'ja-JP': ja,
  'ko-KR': ko,
  'th-TH': th,
};

export function formatDate(date: Date, formatStr: string, language: string) {
  return format(date, formatStr, {
    locale: LOCALE_MAP[language] || enUS
  });
}

// Usage
formatDate(new Date(), 'PPP', 'en-US')  // "January 15, 2025"
formatDate(new Date(), 'PPP', 'zh-CN')  // "2025年1月15日"
formatDate(new Date(), 'PPP', 'ja-JP')  // "2025年1月15日"
```

### Currency Formatting

```typescript
export function formatCurrency(
  amount: number,
  currency: string,
  language: string
): string {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Usage
formatCurrency(199, 'AUD', 'en-AU')  // "$199.00"
formatCurrency(199, 'CNY', 'zh-CN')  // "¥199.00"
formatCurrency(199, 'JPY', 'ja-JP')  // "¥199"
formatCurrency(199, 'KRW', 'ko-KR')  // "₩199"
formatCurrency(199, 'THB', 'th-TH')  // "฿199.00"
```

### Number Formatting

```typescript
export function formatNumber(
  value: number,
  language: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(language, options).format(value);
}

// Usage
formatNumber(1234567.89, 'en-US')  // "1,234,567.89"
formatNumber(1234567.89, 'zh-CN')  // "1,234,567.89"
formatNumber(1234567.89, 'de-DE')  // "1.234.567,89"
```

### Time Zones

```typescript
// Store user's timezone
model User {
  timezone String @default("Australia/Sydney")
}

// Display times in user's timezone
import { utcToZonedTime, format } from 'date-fns-tz';

export function formatInTimezone(
  date: Date,
  timezone: string,
  formatStr: string
): string {
  const zonedDate = utcToZonedTime(date, timezone);
  return format(zonedDate, formatStr, { timeZone: timezone });
}

// Usage
const lessonTime = new Date('2025-01-15T16:00:00Z');
formatInTimezone(lessonTime, 'Australia/Sydney', 'PPPp')
// "January 16, 2025 at 3:00 AM AEDT"

formatInTimezone(lessonTime, 'Asia/Singapore', 'PPPp')
// "January 16, 2025 at 12:00 AM SGT"
```

---

## RTL Support

For languages like Arabic (future), add RTL support:

```typescript
// Detect RTL languages
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export function isRTL(language: string): boolean {
  return RTL_LANGUAGES.some(rtl => language.startsWith(rtl));
}

// Apply RTL to HTML
<html dir={isRTL(i18n.language) ? 'rtl' : 'ltr'}>

// Material-UI theme
const theme = createTheme({
  direction: isRTL(i18n.language) ? 'rtl' : 'ltr',
  // ...
});

// RTL-aware CSS
.container {
  margin-left: 20px; /* LTR */

  [dir="rtl"] & {
    margin-left: 0;
    margin-right: 20px;
  }
}
```

---

## API Endpoints

### Language Management

```
GET    /api/v1/languages
       → [{ code: "en-US", name: "English", nativeName: "English" }, ...]

GET    /api/v1/languages/supported
       → ["en-US", "zh-CN", "ja-JP", ...]

PATCH  /api/v1/users/me/language
       { language: "zh-CN" }
       → { success: true }

GET    /api/v1/schools/:id/languages
       → { default: "en-US", supported: ["en-US", "zh-CN"] }

PATCH  /api/v1/schools/:id/languages
       {
         defaultLanguage: "zh-CN",
         supportedLanguages: ["zh-CN", "en-US", "zh-TW"]
       }
       → { success: true }
```

### Translation Management (Optional - Admin)

```
GET    /api/v1/translations
       ?entityType=LESSON&entityId=xxx&language=zh-CN
       → [{ field: "title", value: "钢琴基础 1" }, ...]

POST   /api/v1/translations
       {
         entityType: "LESSON",
         entityId: "lesson_123",
         field: "title",
         language: "zh-CN",
         value: "钢琴基础 1"
       }
       → { id, success: true }

DELETE /api/v1/translations/:id
       → { success: true }
```

### Translation File Download (For translators)

```
GET    /api/v1/locales/export
       ?language=zh-CN&namespaces=common,dashboard,lessons
       → (ZIP file with JSON translation files)

POST   /api/v1/locales/import
       (Upload ZIP with translated JSON files)
       → { filesImported: 10, success: true }
```

---

## Implementation Phases

### Phase 3-i18n-A: Foundation (1 week)

**Goal:** Core i18n infrastructure

**Deliverables:**
1. ✅ Install and configure i18next (frontend & backend)
2. ✅ Create translation file structure
3. ✅ Implement language detection middleware
4. ✅ Add database schema (User.language, School.defaultLanguage)
5. ✅ Create LanguageSelector component
6. ✅ Basic English translations (common, dashboard)

**Testing:**
- Verify language switching works
- Verify localStorage persistence
- Test language detection priority

---

### Phase 3-i18n-B: Core Translations (1 week)

**Goal:** Translate all system text

**Deliverables:**
1. ✅ English translations (all namespaces)
2. ✅ Simplified Chinese translations
3. ✅ Material-UI localization
4. ✅ Date/time formatting
5. ✅ Currency formatting
6. ✅ Number formatting

**Testing:**
- Visual QA in all languages
- Test pluralization
- Test interpolation

---

### Phase 3-i18n-C: Additional Languages (1-2 weeks)

**Goal:** Add Asian market languages

**Deliverables:**
1. ✅ Traditional Chinese (zh-TW)
2. ✅ Japanese (ja-JP)
3. ✅ Korean (ko-KR)
4. ✅ Thai (th-TH)
5. ✅ Indonesian (id-ID)
6. ✅ Malay (ms-MY)

**Method:**
- Use professional translation service (e.g., Lokalise, Crowdin)
- Native speaker review
- Community contributions (GitHub PRs)

**Testing:**
- Native speaker QA for each language
- Cultural appropriateness review
- Test all languages in production

---

## Translation Workflow

### Developer Workflow

```bash
# 1. Developer adds new feature with English text
<button>{t('lessons.hybrid.openBookings')}</button>

# 2. Run extraction script to find missing keys
npm run i18n:extract

# 3. Script adds key to en-US/lessons.json
{
  "hybrid": {
    "openBookings": "Open Bookings"  // ← Added automatically
  }
}

# 4. Push to translation service (Lokalise/Crowdin)
npm run i18n:push

# 5. Translators translate via web UI

# 6. Pull completed translations
npm run i18n:pull

# 7. Commit updated translation files
git add locales/
git commit -m "chore: update translations"
```

### Translation Tools

**Option 1: Lokalise** (Recommended)
- Web-based translation management
- Professional translator marketplace
- GitHub integration
- $120/month (unlimited keys, 10 languages)

**Option 2: Crowdin**
- Similar to Lokalise
- Community translation option
- GitHub integration
- $50/month (open source plan)

**Option 3: Manual (Budget option)**
- Export JSON files
- Send to translator
- Import translated files
- Free, but more manual work

### Translation Quality

**Quality Tiers:**

**Tier 1: Machine Translation (Quick, Cheap)**
- Use Google Translate API
- Cost: ~$20 per million characters
- Quality: 70-80% accurate
- Good for: Internal testing, non-critical text

**Tier 2: Professional Translation (High Quality)**
- Use Lokalise/Crowdin marketplace
- Cost: $0.10-0.20 per word
- Quality: 95%+ accurate
- Good for: All customer-facing text

**Tier 3: Native Speaker Review (Best)**
- Professional translation + native review
- Cost: $0.20-0.40 per word
- Quality: 99%+ accurate
- Good for: Marketing, legal text

### Missing Translation Handling

```typescript
// Frontend: Show original English + indicator
{
  missingKeyHandler: (lng, ns, key, fallbackValue) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation: ${lng}.${ns}.${key}`);
    }
    return `${fallbackValue} [EN]`; // Shows "[EN]" indicator
  }
}

// Production: Silently fall back to English
{
  missingKeyHandler: (lng, ns, key, fallbackValue) => {
    return fallbackValue;
  }
}
```

---

## Best Practices

### DO's ✅

1. **Use translation keys, never hardcoded text:**
   ```typescript
   // ✅ Good
   <button>{t('common:buttons.save')}</button>

   // ❌ Bad
   <button>Save</button>
   ```

2. **Use namespaces to organize translations:**
   ```typescript
   t('dashboard:welcome')
   t('lessons:hybrid.bookingsOpen')
   ```

3. **Provide context for translators:**
   ```json
   {
     "delete": "Delete",
     "_comment": "Button to permanently delete a lesson. Show confirmation dialog."
   }
   ```

4. **Use interpolation for dynamic content:**
   ```typescript
   t('welcome', { name: user.firstName })
   ```

5. **Handle pluralization:**
   ```json
   {
     "studentCount": "{{count}} student",
     "studentCount_plural": "{{count}} students"
   }
   ```

6. **Test in all supported languages regularly**

7. **Use professional translators for customer-facing text**

### DON'Ts ❌

1. **Don't concatenate translated strings:**
   ```typescript
   // ❌ Bad
   t('welcome') + ' ' + user.name

   // ✅ Good
   t('welcome', { name: user.name })
   ```

2. **Don't assume text length:**
   ```css
   /* ❌ Bad - German text is 30% longer */
   .button { width: 100px; }

   /* ✅ Good - Let text determine width */
   .button { padding: 8px 16px; }
   ```

3. **Don't put HTML in translation strings:**
   ```json
   // ❌ Bad
   { "message": "Click <a href='/help'>here</a> for help" }

   // ✅ Good
   { "message": "Click {{link}} for help" }
   ```
   ```typescript
   <Trans i18nKey="message">
     Click <a href="/help">here</a> for help
   </Trans>
   ```

4. **Don't use machine translation for production without review**

5. **Don't forget to update translations when features change**

---

## Language-Specific Considerations

### Chinese (zh-CN, zh-TW)

- **No plural forms** - Same text for singular/plural
- **Date format:** Year-Month-Day (2025年1月15日)
- **Names:** Family name first (Wang Ming, not Ming Wang)
- **Formal vs casual:** Use formal tone for all communication

### Japanese (ja-JP)

- **Politeness levels:** Use polite form (です/ます)
- **Date format:** Year-Month-Day (2025年1月15日)
- **No spaces:** between words in Japanese text
- **Character sets:** Support Hiragana, Katakana, Kanji

### Korean (ko-KR)

- **Honorifics:** Use formal/polite form
- **Date format:** Year-Month-Day (2025년 1월 15일)
- **Spacing:** Unlike Japanese, Korean uses spaces
- **Currency:** Won (₩) - no decimal places

### Thai (th-TH)

- **No spaces:** between words in Thai
- **Date format:** Buddhist calendar option (2568)
- **Formal tone:** Use polite particles (ครับ/ค่ะ)
- **Currency:** Baht (฿)

### Indonesian/Malay (id-ID, ms-MY)

- **Latin script:** Easier to implement
- **Formal tone:** Use "Anda" (formal you)
- **Date format:** Day-Month-Year
- **Currency:** Rupiah (Rp) for Indonesian, Ringgit (RM) for Malay

---

## Success Metrics

### Translation Coverage

- **System text:** 100% translated (all UI)
- **Emails:** 100% translated (templates)
- **Notifications:** 100% translated (messages)
- **Help docs:** 80%+ translated (critical articles)

### Language Usage

Track which languages are used:
```sql
SELECT language, COUNT(*) as users
FROM "User"
GROUP BY language
ORDER BY users DESC;
```

### Translation Quality

- **Missing translations:** <1%
- **Native speaker approval:** >95%
- **User satisfaction:** Survey after language switch

### Performance

- **Translation load time:** <100ms
- **Page load impact:** <50ms additional
- **Bundle size increase:** <500KB per language

---

## Cost Estimate

### One-Time Costs

**Professional Translation (8 languages):**
- System text: ~20,000 words × $0.15/word × 7 languages = $21,000
- Email templates: ~2,000 words × $0.15/word × 7 languages = $2,100
- Help docs: ~10,000 words × $0.15/word × 7 languages = $10,500
- **Total:** ~$33,600

**Budget Option (Machine Translation + Light Review):**
- Machine translation: ~$100
- Native speaker spot-checking: ~$2,000
- **Total:** ~$2,100

### Recurring Costs

**Translation Management Platform:**
- Lokalise: $120/month
- Or Crowdin: $50/month

**Updates & Maintenance:**
- New features: ~$500/month (ongoing translations)
- Quarterly review: ~$1,000/quarter

---

## Recommended Approach

### Phase 3 Launch (Basic i18n)

**Languages:**
1. English (en-US, en-AU) - Complete
2. Simplified Chinese (zh-CN) - Professional translation
3. Japanese (ja-JP) - Professional translation

**Scope:**
- System UI (100%)
- Email templates (100%)
- Help docs (critical articles only)

**Cost:** ~$10,000-15,000

### Phase 4 Expansion

Add remaining languages:
- Traditional Chinese (zh-TW)
- Korean (ko-KR)
- Thai (th-TH)
- Indonesian (id-ID)
- Malay (ms-MY)

**Cost:** ~$15,000-20,000

---

## Conclusion

Implementing i18n following WordPress's translation model provides:

✅ **Scalability:** Easy to add new languages
✅ **Maintainability:** Centralized translation files
✅ **Performance:** JSON files cached, fast loading
✅ **Flexibility:** Professional or community translations
✅ **Developer-Friendly:** Simple API, clear workflow

With proper implementation, Music 'n Me can successfully expand into Asian markets with localized experiences that feel native to each region.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-21
**Integration:** Phase 3B or 3C (2-3 weeks)
