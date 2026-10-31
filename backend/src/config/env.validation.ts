// SaaS integrations degrade gracefully in development (e-mails are logged, billing and
// Google login are disabled) but must be configured in production.
const SAAS_REQUIRED_IN_PRODUCTION = [
  'RESEND_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID_MONTHLY',
];
const SAAS_OPTIONAL = ['GOOGLE_CLIENT_ID', 'EMAIL_FROM'];

export function validateEnv(config: Record<string, unknown>) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = config.NODE_ENV === 'production';

  if (!config.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  const jwtSecret = config.JWT_SECRET ? String(config.JWT_SECRET) : '';
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required');
  } else if (isProduction) {
    if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }
    if (jwtSecret.startsWith('CHANGE_THIS')) {
      errors.push('JWT_SECRET still has the placeholder value — generate a real secret');
    }
  }

  for (const name of SAAS_REQUIRED_IN_PRODUCTION) {
    if (!config[name]) {
      (isProduction ? errors : warnings).push(`${name} is not set`);
    }
  }
  for (const name of SAAS_OPTIONAL) {
    if (!config[name]) {
      warnings.push(`${name} is not set`);
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `[env] ${warnings.join('; ')}. E-mails serão apenas logados; billing/Google login ficam desativados até configurar.`,
    );
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }

  return config;
}
