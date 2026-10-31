import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

/** Error message the frontend keys off to send the user to the billing page. */
export const SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED';

interface AccessFields {
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  subscription?: { status: string } | null;
}

/** Trial still running, or a subscription that Stripe reports as active. */
export function hasAccess(user: AccessFields, now: Date = new Date()): boolean {
  if (user.subscriptionStatus === 'ACTIVE') return true;
  if (user.trialEndsAt && user.trialEndsAt > now) return true;
  const status = user.subscription?.status;
  return status === 'ACTIVE' || status === 'TRIALING';
}

/**
 * Gates the workspace (clients, batches, creatives) behind the trial/subscription.
 * Platform admins (the internal team) are never billed.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        subscriptionStatus: true,
        trialEndsAt: true,
        subscription: { select: { status: true } },
      },
    });
    if (!dbUser) {
      throw new UnauthorizedException();
    }

    if (hasAccess(dbUser)) {
      return true;
    }

    throw new ForbiddenException(SUBSCRIPTION_REQUIRED);
  }
}
