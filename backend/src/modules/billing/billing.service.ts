import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../config/prisma.service';
import { EmailService } from '../email/email.service';
import { hasAccess } from '../auth/subscription.guard';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Maps a Stripe subscription status onto User.subscriptionStatus */
export function mapStripeStatus(status: string): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' {
  if (status === 'active' || status === 'trialing') return 'ACTIVE';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'PAST_DUE';
  return 'CANCELED';
}

/** Billing periods moved from the subscription to its items in recent Stripe API versions */
export function subscriptionPeriod(subscription: Stripe.Subscription): { start: Date; end: Date } {
  type Period = { current_period_start?: number; current_period_end?: number };
  const item = subscription.items?.data?.[0] as (Stripe.SubscriptionItem & Period) | undefined;
  const legacy = subscription as unknown as Period;
  const nowSec = Math.floor(Date.now() / 1000);
  const start = item?.current_period_start ?? legacy.current_period_start ?? nowSec;
  const end = item?.current_period_end ?? legacy.current_period_end ?? start + 30 * 24 * 60 * 60;
  return { start: new Date(start * 1000), end: new Date(end * 1000) };
}

const customerIdOf = (customer: Stripe.Invoice['customer'] | Stripe.Subscription['customer']) =>
  typeof customer === 'string' ? customer : customer?.id ?? null;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;
  private readonly frontendUrl: string;
  private readonly monthlyPriceId: string;
  private readonly webhookSecret: string;
  private priceCache?: Promise<{ amount: number | null; currency: string }>;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secretKey ? new Stripe(secretKey) : null;
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    this.monthlyPriceId = this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY') || '';
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  /** True when Stripe keys and the monthly price are configured */
  get enabled(): boolean {
    return !!this.stripe && !!this.monthlyPriceId;
  }

  private client(): Stripe {
    if (!this.stripe || !this.monthlyPriceId) {
      throw new ServiceUnavailableException(
        'Cobrança não configurada neste ambiente (STRIPE_SECRET_KEY / STRIPE_PRICE_ID_MONTHLY)',
      );
    }
    return this.stripe;
  }

  async createCheckoutSession(userId: string) {
    const stripe = this.client();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }
    const current = user.subscription?.status;
    if (current === 'ACTIVE' || current === 'TRIALING') {
      throw new BadRequestException('Você já tem uma assinatura ativa. Use o portal para gerenciá-la.');
    }

    // Get or create the Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await this.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: this.monthlyPriceId, quantity: 1 }],
      success_url: `${this.frontendUrl}/billing?success=true`,
      cancel_url: `${this.frontendUrl}/billing?canceled=true`,
      locale: 'pt-BR',
      allow_promotion_codes: true,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
    });

    return { sessionId: session.id, url: session.url };
  }

  async createPortalSession(userId: string) {
    const stripe = this.client();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      throw new BadRequestException('Nenhuma conta de cobrança encontrada. Assine primeiro.');
    }

    // Optional: pin a portal configuration created by scripts/stripe-setup.mjs
    const configuration = this.configService.get<string>('STRIPE_PORTAL_CONFIGURATION_ID') || undefined;
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.frontendUrl}/billing`,
      locale: 'pt-BR',
      ...(configuration ? { configuration } : {}),
    });

    return { url: session.url };
  }

  /** Price of the monthly plan for the UI, cached per process (Stripe prices are immutable) */
  async getMonthlyPrice(): Promise<{ amount: number | null; currency: string }> {
    if (!this.enabled) return { amount: null, currency: 'brl' };
    if (!this.priceCache) {
      this.priceCache = this.client()
        .prices.retrieve(this.monthlyPriceId)
        .then((price) => ({ amount: price.unit_amount, currency: price.currency }))
        .catch((err: Error) => {
          this.logger.warn(`Could not load Stripe price ${this.monthlyPriceId}: ${err.message}`);
          this.priceCache = undefined;
          return { amount: null, currency: 'brl' };
        });
    }
    return this.priceCache;
  }

  async getSubscriptionStatus(requester: { id: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: requester.id },
      include: { subscription: { include: { plan: true } } },
    });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const now = new Date();
    const isTrialActive = !!user.trialEndsAt && user.trialEndsAt > now;
    const trialDaysLeft = isTrialActive
      ? Math.ceil((user.trialEndsAt!.getTime() - now.getTime()) / MS_PER_DAY)
      : 0;
    const price = await this.getMonthlyPrice();
    const isAdmin = requester.role === 'ADMIN';

    return {
      billingEnabled: this.enabled,
      isAdmin,
      hasAccess: isAdmin || hasAccess(user, now),
      subscriptionStatus: user.subscriptionStatus,
      isTrialActive,
      trialDaysLeft,
      trialEndsAt: user.trialEndsAt,
      priceMonthly: price.amount,
      currency: price.currency,
      subscription: user.subscription
        ? {
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
            plan: user.subscription.plan
              ? { name: user.subscription.plan.displayName, price: user.subscription.plan.priceMonthly }
              : null,
          }
        : null,
    };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const stripe = this.client();
    if (!this.webhookSecret) {
      throw new ServiceUnavailableException('STRIPE_WEBHOOK_SECRET não configurado');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        // The subscription itself arrives through customer.subscription.created
        this.logger.log(`Checkout completed: ${(event.data.object as Stripe.Checkout.Session).id}`);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async resolveUserId(subscription: Stripe.Subscription): Promise<string | null> {
    if (subscription.metadata?.userId) return subscription.metadata.userId;
    const customerId = customerIdOf(subscription.customer);
    if (!customerId) return null;
    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  /** Mirrors the Stripe subscription into Plan/Subscription and the user's status */
  async syncSubscription(subscription: Stripe.Subscription) {
    const userId = await this.resolveUserId(subscription);
    if (!userId) {
      this.logger.warn(`Subscription ${subscription.id} has no userId metadata and unknown customer`);
      return;
    }

    const price = subscription.items.data[0]?.price;
    const priceId = price?.id ?? this.monthlyPriceId;

    const plan =
      (await this.prisma.plan.findFirst({ where: { stripePriceId: priceId } })) ??
      (await this.prisma.plan.create({
        data: {
          name: priceId,
          displayName: price?.nickname || 'Pro',
          priceMonthly: price?.unit_amount ?? 0,
          stripePriceId: priceId,
        },
      }));

    const period = subscriptionPeriod(subscription);
    const data = {
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status.toUpperCase(),
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    };

    const existing = await this.prisma.subscription.findUnique({ where: { userId } });
    if (existing) {
      await this.prisma.subscription.update({ where: { userId }, data });
    } else {
      await this.prisma.subscription.create({ data: { userId, ...data } });
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: mapStripeStatus(subscription.status) },
    });

    // First activation: confirm the payment by e-mail (renewals are handled by invoice events)
    if (subscription.status === 'active' && existing?.status !== 'ACTIVE') {
      await this.emailService.sendPaymentSuccessEmail(
        user.email,
        user.fullName,
        price?.unit_amount ?? 0,
        plan.displayName,
      );
    }

    this.logger.log(`Subscription synced for user ${userId}: ${subscription.status}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = await this.resolveUserId(subscription);
    if (!userId) {
      this.logger.warn(`Deleted subscription ${subscription.id} could not be matched to a user`);
      return;
    }

    const existing = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });
    await this.prisma.subscription.deleteMany({ where: { stripeSubscriptionId: subscription.id } });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'CANCELED' },
    });

    await this.emailService.sendSubscriptionCanceledEmail(
      user.email,
      user.fullName,
      existing?.currentPeriodEnd || new Date(),
    );

    this.logger.log(`Subscription canceled for user ${userId}`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    // The first invoice is confirmed by syncSubscription when the subscription activates
    if (invoice.billing_reason === 'subscription_create') return;

    const customerId = customerIdOf(invoice.customer);
    if (!customerId) return;

    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      include: { subscription: { include: { plan: true } } },
    });

    if (user && invoice.amount_paid && user.subscription?.plan) {
      await this.emailService.sendPaymentSuccessEmail(
        user.email,
        user.fullName,
        invoice.amount_paid,
        user.subscription.plan.displayName,
      );
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = customerIdOf(invoice.customer);
    if (!customerId) return;

    const user = await this.prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
    if (!user) return;

    await this.prisma.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: 'PAST_DUE' },
    });
    await this.emailService.sendPaymentFailedEmail(user.email, user.fullName);

    this.logger.log(`Payment failed for user ${user.id}`);
  }
}
