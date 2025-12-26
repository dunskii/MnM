// ===========================================
// Brand Colors - Central Constants
// ===========================================
// Consolidated brand color definitions for consistent use across components

// Primary brand colors from theme
export const brandColors = {
  // Primary
  primary: '#4580E4',
  primaryLight: '#a3d9f6',
  primaryDark: '#3899ec',

  // Secondary
  secondary: '#FFCE00',
  secondaryLight: '#FFE066',
  secondaryDark: '#E6B800',

  // Accent colors
  mint: '#96DAC9',
  coral: '#FFAE9E',
  cream: '#FCF6E6',

  // Character colors
  alice: '#FFB6C1', // Preschool
  steve: '#FFCE00', // Kids
  liam: '#4580E4', // Teens
  floyd: '#96DAC9', // Adult

  // Semantic
  error: '#ff4040',
  success: '#96DAC9',
  warning: '#FFAE9E',
  info: '#4580E4',

  // Text
  textPrimary: '#080808',
  textSecondary: '#9DA5AF',

  // Backgrounds
  bgDefault: '#ffffff',
  bgPaper: '#FCF6E6',
  bgMuted: '#e0e0e0',
};

// Status color variants (for chips, badges, etc.)
export const statusColors = {
  // Success variants (green-mint tones)
  successBg: '#c5ebe2',
  successText: '#5cb399',

  // Warning variants (coral-red tones)
  warningBg: '#ffd4cc',
  warningText: '#e67761',

  // Info variants (blue tones)
  infoBg: '#a3d9f6',
  infoText: '#4580E4',

  // Pending variants (yellow tones)
  pendingBg: '#FFE066',
  pendingText: '#E6B800',

  // Muted/disabled
  mutedBg: '#e0e0e0',
  mutedText: '#9DA5AF',
};

// Invoice status color mapping
export const invoiceStatusColors = {
  DRAFT: { bg: brandColors.cream, text: brandColors.textSecondary },
  SENT: { bg: statusColors.infoBg, text: statusColors.infoText },
  PAID: { bg: brandColors.mint, text: brandColors.textPrimary },
  PARTIALLY_PAID: { bg: brandColors.secondary, text: brandColors.textPrimary },
  OVERDUE: { bg: brandColors.coral, text: brandColors.error },
  CANCELLED: { bg: statusColors.mutedBg, text: statusColors.mutedText },
  REFUNDED: { bg: statusColors.mutedBg, text: statusColors.mutedText },
} as const;

// Meet & Greet status colors
export const meetAndGreetStatusColors = {
  PENDING_APPROVAL: { bg: statusColors.warningBg, text: statusColors.warningText },
  APPROVED: { bg: statusColors.successBg, text: statusColors.successText },
  SCHEDULED: { bg: statusColors.successBg, text: statusColors.successText },
  COMPLETED: { bg: brandColors.mint, text: brandColors.textPrimary },
  CANCELLED: { bg: statusColors.mutedBg, text: statusColors.mutedText },
} as const;

// Lesson type colors
export const lessonTypeColors = {
  INDIVIDUAL: brandColors.primary,
  GROUP: brandColors.mint,
  BAND: brandColors.coral,
  HYBRID: brandColors.secondary,
} as const;

// File type colors for Drive/Resources
export const fileTypeColors = {
  image: { bg: '#fce4ec', text: '#c2185b' },
  audio: { bg: '#e3f2fd', text: '#1565c0' },
  video: { bg: '#fff3e0', text: '#e65100' },
  pdf: { bg: '#ffebee', text: '#c62828' },
  spreadsheet: { bg: '#e8f5e9', text: '#2e7d32' },
  document: { bg: statusColors.infoBg, text: statusColors.infoText },
  default: { bg: statusColors.mutedBg, text: statusColors.mutedText },
} as const;
