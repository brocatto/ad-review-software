#!/usr/bin/env node
/**
 * Idempotent Stripe setup for AdReviewOS: product, monthly price, webhook endpoint and
 * customer portal. Safe to run many times; works in test or live mode depending on the key.
 *
 *   STRIPE_SECRET_KEY=sk_live_... API_URL=https://api.adreviewos.com node scripts/stripe-setup.mjs
 *
 * Optional: PRICE_BRL_CENTS (default 9900), FRONTEND_URL (default https://adreviewos.com),
 *           PRODUCT_NAME (default "AdReviewOS Pro").
 * Prints the env values to paste into the backend (STRIPE_PRICE_ID_MONTHLY, STRIPE_WEBHOOK_SECRET).
 */
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('STRIPE_SECRET_KEY is required (sk_test_... or sk_live_...)');
  process.exit(2);
}

const stripe = new Stripe(key);
const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST';
const amount = Number(process.env.PRICE_BRL_CENTS || 9900);
const apiUrl = (process.env.API_URL || '').replace(/\/$/, '');
const frontendUrl = (process.env.FRONTEND_URL || 'https://adreviewos.com').replace(/\/$/, '');
const productName = process.env.PRODUCT_NAME || 'AdReviewOS Pro';

const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];

const log = (...args) => console.log(`[stripe ${mode}]`, ...args);

// Account readiness
const account = await stripe.accounts.retrieve();
log(`account ${account.id} (${account.country}, ${account.default_currency})`);
if (mode === 'LIVE' && !account.charges_enabled) {
  log('ATENÇÃO: a conta ainda não aceita cobranças (charges_enabled=false). Complete a ativação no dashboard do Stripe.');
}

// Product: reuse the one tagged app=adreviewos, otherwise any active product named like AdReview
const products = (await stripe.products.list({ limit: 100, active: true })).data;
let product =
  products.find((p) => p.metadata?.app === 'adreviewos') || products.find((p) => /adreview/i.test(p.name));
if (!product) {
  product = await stripe.products.create({
    name: productName,
    description: 'Aprovação de criativos: lotes ilimitados, link para o cliente, revisões e histórico.',
    url: frontendUrl,
    metadata: { app: 'adreviewos' },
  });
  log('product created:', product.id);
} else {
  log('product found:', product.id, `(${product.name})`);
  if (product.metadata?.app !== 'adreviewos') {
    await stripe.products.update(product.id, { metadata: { ...product.metadata, app: 'adreviewos' } });
  }
}

// Monthly BRL price with the configured amount
const prices = (await stripe.prices.list({ product: product.id, active: true, limit: 100 })).data;
let price = prices.find(
  (p) => p.currency === 'brl' && p.recurring?.interval === 'month' && p.unit_amount === amount,
);
if (!price) {
  price = await stripe.prices.create({
    product: product.id,
    currency: 'brl',
    unit_amount: amount,
    recurring: { interval: 'month' },
    nickname: 'Pro mensal',
    metadata: { app: 'adreviewos' },
  });
  log('price created:', price.id, `R$ ${(amount / 100).toFixed(2)}/mês`);
} else {
  log('price found:', price.id, `R$ ${(price.unit_amount / 100).toFixed(2)}/mês`);
}
if (product.default_price !== price.id) {
  await stripe.products.update(product.id, { default_price: price.id });
}

// Webhook endpoint (the signing secret is only returned at creation time)
let webhookSecret = null;
if (apiUrl) {
  const url = `${apiUrl}/webhooks/stripe`;
  const endpoints = (await stripe.webhookEndpoints.list({ limit: 100 })).data;
  let endpoint = endpoints.find((e) => e.url === url);
  if (!endpoint) {
    endpoint = await stripe.webhookEndpoints.create({
      url,
      enabled_events: WEBHOOK_EVENTS,
      description: 'AdReviewOS billing sync',
      metadata: { app: 'adreviewos' },
    });
    webhookSecret = endpoint.secret;
    log('webhook created:', endpoint.id, url);
  } else {
    const missing = WEBHOOK_EVENTS.filter((e) => !endpoint.enabled_events.includes(e));
    if (missing.length || endpoint.status !== 'enabled') {
      await stripe.webhookEndpoints.update(endpoint.id, { enabled_events: WEBHOOK_EVENTS, disabled: false });
      log('webhook updated:', endpoint.id);
    } else {
      log('webhook found:', endpoint.id, url);
    }
    log('(o signing secret só aparece na criação; se precisar dele de novo, copie no dashboard do webhook)');
  }
} else {
  log('API_URL não informado: pulando o webhook (rode de novo com API_URL=https://sua-api)');
}

// Customer portal: update the default configuration (dashboard-created) or create one
const portalParams = {
  business_profile: {
    headline: 'Gerencie sua assinatura do AdReviewOS',
    privacy_policy_url: `${frontendUrl}/privacidade`,
    terms_of_service_url: `${frontendUrl}/termos`,
  },
  default_return_url: `${frontendUrl}/billing`,
  features: {
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    customer_update: { enabled: true, allowed_updates: ['email', 'address', 'tax_id'] },
    subscription_cancel: {
      enabled: true,
      mode: 'at_period_end',
      cancellation_reason: {
        enabled: true,
        options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'other'],
      },
    },
  },
  metadata: { app: 'adreviewos' },
};
const configs = (await stripe.billingPortal.configurations.list({ limit: 100 })).data;
let portal = configs.find((c) => c.is_default) || configs.find((c) => c.metadata?.app === 'adreviewos');
if (portal) {
  portal = await stripe.billingPortal.configurations.update(portal.id, portalParams);
  log('portal configuration updated:', portal.id, portal.is_default ? '(default)' : '');
} else {
  portal = await stripe.billingPortal.configurations.create(portalParams);
  log('portal configuration created:', portal.id);
}

console.log('\nVariáveis para o backend:');
console.log(`STRIPE_PRICE_ID_MONTHLY=${price.id}`);
if (webhookSecret) console.log(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
if (!portal.is_default) console.log(`STRIPE_PORTAL_CONFIGURATION_ID=${portal.id}`);
console.log(`\nCheckout: ${frontendUrl}/billing  |  Webhook: ${apiUrl ? apiUrl + '/webhooks/stripe' : '(pendente)'}`);
