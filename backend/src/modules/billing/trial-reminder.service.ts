import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { EmailService } from '../email/email.service';

export const TRIAL_REMINDER_DAYS_BEFORE = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Daily reminder for self-service accounts whose trial ends in TRIAL_REMINDER_DAYS_BEFORE days.
 * The 24h window plus the daily schedule means each account is reminded exactly once,
 * without needing an extra column.
 */
@Injectable()
export class TrialReminderService {
  private readonly logger = new Logger(TrialReminderService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'America/Sao_Paulo' })
  async sendTrialEndingReminders(now: Date = new Date()): Promise<number> {
    const windowStart = new Date(now.getTime() + (TRIAL_REMINDER_DAYS_BEFORE - 1) * MS_PER_DAY);
    const windowEnd = new Date(now.getTime() + TRIAL_REMINDER_DAYS_BEFORE * MS_PER_DAY);

    const users = await this.prisma.user.findMany({
      where: {
        subscriptionStatus: 'TRIAL',
        role: { not: 'ADMIN' },
        emailVerified: true,
        subscription: null,
        trialEndsAt: { gt: windowStart, lte: windowEnd },
      },
      select: { id: true, email: true, fullName: true, trialEndsAt: true },
    });

    let sent = 0;
    for (const user of users) {
      const daysLeft = Math.max(
        1,
        Math.ceil((user.trialEndsAt!.getTime() - now.getTime()) / MS_PER_DAY),
      );
      try {
        if (await this.emailService.sendTrialEndingEmail(user.email, user.fullName, daysLeft)) {
          sent++;
        }
      } catch (error) {
        this.logger.warn(`Trial reminder failed for ${user.email}: ${(error as Error).message}`);
      }
    }

    if (users.length > 0) {
      this.logger.log(`Trial reminders: ${sent}/${users.length} sent`);
    }
    return sent;
  }
}
