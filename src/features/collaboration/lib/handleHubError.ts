import { toast } from 'sonner';
import { parseHubError, getHubErrorMessage, type HubErrorCode, type HubError } from '../model/hubErrors';

export interface HubErrorHandlerOptions {
  /** Custom messages per error code */
  customMessages?: Partial<Record<HubErrorCode, string>>;
  /** Callback for specific error codes */
  onError?: (code: HubErrorCode | string, message: string) => void;
  /** Whether to show a toast (default: true) */
  showToast?: boolean;
}

/**
 * Standard error handler for hub operations.
 * Parses the error, shows appropriate toast, and optionally calls back.
 */
export function handleHubError(error: unknown, options: HubErrorHandlerOptions = {}): HubError {
  const { customMessages, onError, showToast = true } = options;

  const hubError = parseHubError(error);
  const message = customMessages?.[hubError.code as HubErrorCode] ?? getHubErrorMessage(hubError);

  if (showToast) {
    toast.error(message);
  }

  onError?.(hubError.code, message);

  if (process.env.NODE_ENV !== 'production') {
    console.error('[HubError]', hubError.code, hubError.message);
  }

  return hubError;
}
