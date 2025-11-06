/**
 * Toast Notification Utility
 * Centralized toast notification system using Sonner
 */

import { toast as sonnerToast } from 'sonner';

// Re-export toast methods for convenience
export const toast = {
  success: sonnerToast.success,
  error: sonnerToast.error,
  info: sonnerToast.info,
  warning: sonnerToast.warning,
  loading: sonnerToast.loading,
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
};
