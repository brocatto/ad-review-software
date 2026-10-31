import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SubscriptionGuard, SUBSCRIPTION_REQUIRED, hasAccess } from './subscription.guard';

const DAY = 24 * 60 * 60 * 1000;

describe('hasAccess', () => {
  const now = new Date('2026-10-31T12:00:00Z');

  it('allows an ACTIVE account', () => {
    expect(hasAccess({ subscriptionStatus: 'ACTIVE', trialEndsAt: null }, now)).toBe(true);
  });

  it('allows a running trial', () => {
    expect(
      hasAccess({ subscriptionStatus: 'TRIAL', trialEndsAt: new Date(now.getTime() + DAY) }, now),
    ).toBe(true);
  });

  it('blocks an expired trial without subscription', () => {
    expect(
      hasAccess({ subscriptionStatus: 'TRIAL', trialEndsAt: new Date(now.getTime() - DAY) }, now),
    ).toBe(false);
  });

  it('falls back to the Stripe subscription row', () => {
    expect(
      hasAccess(
        { subscriptionStatus: 'NONE', trialEndsAt: null, subscription: { status: 'TRIALING' } },
        now,
      ),
    ).toBe(true);
    expect(
      hasAccess(
        { subscriptionStatus: 'CANCELED', trialEndsAt: null, subscription: { status: 'CANCELED' } },
        now,
      ),
    ).toBe(false);
  });
});

describe('SubscriptionGuard', () => {
  let prisma: any;
  let guard: SubscriptionGuard;

  const contextFor = (user?: { id: string; role: string }) =>
    ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as any;

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    guard = new SubscriptionGuard(prisma);
  });

  it('rejects unauthenticated requests', async () => {
    await expect(guard.canActivate(contextFor(undefined))).rejects.toThrow(UnauthorizedException);
  });

  it('lets platform admins through without touching the database', async () => {
    await expect(guard.canActivate(contextFor({ id: 'u1', role: 'ADMIN' }))).resolves.toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('allows a manager whose trial is still running', async () => {
    prisma.user.findUnique.mockResolvedValue({
      subscriptionStatus: 'TRIAL',
      trialEndsAt: new Date(Date.now() + DAY),
      subscription: null,
    });

    await expect(guard.canActivate(contextFor({ id: 'u1', role: 'MANAGER' }))).resolves.toBe(true);
  });

  it('blocks a manager whose trial ended with the SUBSCRIPTION_REQUIRED message', async () => {
    prisma.user.findUnique.mockResolvedValue({
      subscriptionStatus: 'TRIAL',
      trialEndsAt: new Date(Date.now() - DAY),
      subscription: null,
    });

    await expect(guard.canActivate(contextFor({ id: 'u1', role: 'MANAGER' }))).rejects.toThrow(
      new ForbiddenException(SUBSCRIPTION_REQUIRED),
    );
  });

  it('allows a paying subscriber', async () => {
    prisma.user.findUnique.mockResolvedValue({
      subscriptionStatus: 'ACTIVE',
      trialEndsAt: new Date(Date.now() - DAY),
      subscription: { status: 'ACTIVE' },
    });

    await expect(guard.canActivate(contextFor({ id: 'u1', role: 'MANAGER' }))).resolves.toBe(true);
  });
});
