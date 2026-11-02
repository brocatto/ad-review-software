import * as Sentry from '@sentry/node';
import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

/** Error monitoring is opt-in: without SENTRY_DSN nothing is initialized or sent. */
export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  });
  return true;
}

/**
 * Reports unexpected failures (anything that is not a deliberate 4xx HttpException)
 * and then lets Nest produce the normal response.
 */
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      const request = host.switchToHttp().getRequest<{ method?: string; url?: string; user?: { id?: string } }>();
      Sentry.withScope((scope) => {
        if (request?.method && request?.url) {
          scope.setTag('route', `${request.method} ${request.url.split('?')[0]}`);
        }
        if (request?.user?.id) {
          scope.setUser({ id: request.user.id });
        }
        Sentry.captureException(exception);
      });
    }

    super.catch(exception, host);
  }
}
