export function validateEnv(config: Record<string, unknown>) {
  const errors: string[] = [];
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

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }

  return config;
}
