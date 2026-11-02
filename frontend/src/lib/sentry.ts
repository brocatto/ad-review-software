import * as Sentry from '@sentry/react';

const DSN: string | undefined = import.meta.env.VITE_SENTRY_DSN || undefined;

/** Error monitoring is opt-in: without VITE_SENTRY_DSN nothing is sent anywhere. */
export function initSentry() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || undefined,
    tracesSampleRate: 0.1,
  });
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
