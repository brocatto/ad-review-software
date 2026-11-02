// SaaS smoke test (local only: reads tokens from the dev Postgres container). Usage: SMOKE_PASSWORD=... node scripts/smoke-saas.mjs <apiUrl>
// -> expired trial blocked -> Stripe checkout session -> forgot/reset password -> admin bypass. Cleans up.
import { execFileSync } from 'node:child_process';

const API = process.argv[2] || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.SMOKE_EMAIL || 'admin@adverse.com';
const ADMIN_PASSWORD = process.env.SMOKE_PASSWORD;
const PG = ['exec', 'tinder-ad-software-postgres-1', 'psql', '-U', 'postgres', '-d', 'ad_review', '-tAc'];

const sql = (q) => execFileSync('docker', [...PG, q], { encoding: 'utf8' }).trim();

let failures = 0;
const check = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`);
};

async function req(method, path, { body, token, expect } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(API + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (expect !== undefined) {
    check(res.status === expect, `${method} ${path} -> ${res.status}${res.status === expect ? '' : ` (expected ${expect}) ${JSON.stringify(data).slice(0, 220)}`}`);
  }
  return { status: res.status, data };
}

const ts = Date.now();
const email = 'delivered@resend.dev'; // Resend test inbox: accepted, never bounces
const password = 'senha-forte-123';
let userId;
sql(`DELETE FROM users WHERE email='${email}'`); // leftovers from an interrupted run

try {
  // Signup + blocked login
  const signup = await req('POST', '/auth/signup', { body: { email, password, fullName: 'Smoke SaaS' }, expect: 201 });
  check(/confirma/i.test(signup.data?.message || ''), 'signup answers with the confirmation message');
  await req('POST', '/auth/signup', { body: { email, password, fullName: 'Smoke SaaS' }, expect: 409 });
  await req('POST', '/auth/signup', { body: { email: `x${ts}@example.com`, password: 'curta', fullName: 'X' }, expect: 400 });
  const blocked = await req('POST', '/auth/login', { body: { email, password }, expect: 401 });
  check(/Confirme seu e-mail/.test(blocked.data?.message || ''), 'login is blocked until the e-mail is confirmed');

  // Verification token straight from the database (the e-mail itself may not be deliverable here)
  const row = sql(`SELECT id || '|' || verification_token || '|' || subscription_status FROM users WHERE email='${email}'`);
  const [id, token, status] = row.split('|');
  userId = id;
  check(!!token && status === 'TRIAL', `account created in TRIAL with a verification token (${status})`);
  await req('GET', `/auth/verify-email?token=nope`, { expect: 400 });
  const verified = await req('GET', `/auth/verify-email?token=${token}`, { expect: 200 });
  const userToken = verified.data?.access_token;
  check(!!userToken && verified.data?.user?.subscriptionStatus === 'TRIAL', 'verification logs the user in with a TRIAL account');
  await req('POST', '/auth/login', { body: { email, password }, expect: 201 });

  // Trial access + billing status
  await req('GET', '/batches', { token: userToken, expect: 200 });
  await req('GET', '/clients', { token: userToken, expect: 200 });
  const billing = await req('GET', '/billing/status', { token: userToken, expect: 200 });
  check(billing.data?.isTrialActive === true && billing.data?.trialDaysLeft >= 29 && billing.data?.hasAccess === true,
    `billing status shows an active trial (${billing.data?.trialDaysLeft} days left)`);
  check(billing.data?.billingEnabled === true, 'billing is enabled with the configured Stripe keys');
  check(typeof billing.data?.priceMonthly === 'number' && billing.data.priceMonthly > 0,
    `monthly price loaded from Stripe: ${billing.data?.priceMonthly} ${billing.data?.currency}`);

  // Expire the trial -> workspace blocked, billing still reachable
  sql(`UPDATE users SET trial_ends_at = NOW() - INTERVAL '1 day' WHERE id='${userId}'`);
  const forbidden = await req('GET', '/batches', { token: userToken, expect: 403 });
  check(forbidden.data?.message === 'SUBSCRIPTION_REQUIRED', 'expired trial answers SUBSCRIPTION_REQUIRED');
  await req('POST', '/clients', { token: userToken, body: { name: 'x' }, expect: 403 });
  const expired = await req('GET', '/billing/status', { token: userToken, expect: 200 });
  check(expired.data?.hasAccess === false && expired.data?.isTrialActive === false, 'billing status reflects the expired trial');

  // Stripe checkout (test mode) creates a customer + hosted checkout session
  const checkout = await req('POST', '/billing/checkout', { token: userToken, expect: 201 });
  check(typeof checkout.data?.url === 'string' && checkout.data.url.startsWith('https://checkout.stripe.com/'),
    `checkout session created (${(checkout.data?.url || '').slice(0, 40)}...)`);
  const customer = sql(`SELECT stripe_customer_id FROM users WHERE id='${userId}'`);
  check(customer.startsWith('cus_'), `stripe customer stored (${customer})`);
  await req('POST', '/billing/portal', { token: userToken, expect: 201 });
  await req('POST', '/webhooks/stripe', { body: {}, expect: 400 });

  // Forgot / reset password
  const forgot = await req('POST', '/auth/forgot-password', { body: { email }, expect: 201 });
  check(/Se existir uma conta/.test(forgot.data?.message || ''), 'forgot-password answers generically');
  const resetToken = sql(`SELECT reset_token FROM users WHERE id='${userId}'`);
  check(resetToken.length === 64, 'reset token stored');
  await req('POST', '/auth/reset-password', { body: { token: 'bad', newPassword: 'outra-senha-123' }, expect: 400 });
  await req('POST', '/auth/reset-password', { body: { token: resetToken, newPassword: 'outra-senha-123' }, expect: 201 });
  await req('POST', '/auth/login', { body: { email, password }, expect: 401 });
  await req('POST', '/auth/login', { body: { email, password: 'outra-senha-123' }, expect: 201 });

  // Google login without configuration or with a bogus token must fail cleanly
  const google = await req('POST', '/auth/google', { body: { idToken: 'not-a-real-token' } });
  check(google.status === 400 || google.status === 401, `google auth rejects a bogus token (${google.status})`);

  // Admin bypasses billing
  if (ADMIN_PASSWORD) {
    const admin = await req('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, expect: 201 });
    const adminToken = admin.data?.access_token;
    await req('GET', '/batches', { token: adminToken, expect: 200 });
    const adminBilling = await req('GET', '/billing/status', { token: adminToken, expect: 200 });
    check(adminBilling.data?.isAdmin === true && adminBilling.data?.hasAccess === true, 'admin account is never billed');
  }
} catch (err) {
  failures++;
  console.log('FAIL unexpected error:', err);
} finally {
  if (userId) {
    sql(`DELETE FROM users WHERE id='${userId}'`);
    console.log('cleanup: smoke user removed');
  }
}

console.log(failures === 0 ? '\nSAAS SMOKE OK' : `\nSAAS SMOKE FAILED (${failures} failures)`);
process.exit(failures === 0 ? 0 : 1);
