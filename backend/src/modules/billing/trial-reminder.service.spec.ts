import { TrialReminderService, TRIAL_REMINDER_DAYS_BEFORE } from './trial-reminder.service';

const DAY = 24 * 60 * 60 * 1000;

describe('TrialReminderService', () => {
  let prisma: any;
  let emailService: any;
  let service: TrialReminderService;
  const now = new Date('2026-11-01T13:00:00Z');

  beforeEach(() => {
    prisma = { user: { findMany: jest.fn().mockResolvedValue([]) } };
    emailService = { sendTrialEndingEmail: jest.fn().mockResolvedValue(true) };
    service = new TrialReminderService(prisma, emailService);
  });

  it('queries only self-service trials ending inside the reminder window', async () => {
    await service.sendTrialEndingReminders(now);

    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      subscriptionStatus: 'TRIAL',
      role: { not: 'ADMIN' },
      emailVerified: true,
      subscription: null,
    });
    expect(where.trialEndsAt.gt.getTime()).toBe(now.getTime() + (TRIAL_REMINDER_DAYS_BEFORE - 1) * DAY);
    expect(where.trialEndsAt.lte.getTime()).toBe(now.getTime() + TRIAL_REMINDER_DAYS_BEFORE * DAY);
  });

  it('e-mails each matching account with the days left', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', email: 'a@b.com', fullName: 'Ana', trialEndsAt: new Date(now.getTime() + 2.5 * DAY) },
      { id: 'u2', email: 'c@d.com', fullName: 'Caio', trialEndsAt: new Date(now.getTime() + 3 * DAY) },
    ]);

    const sent = await service.sendTrialEndingReminders(now);

    expect(sent).toBe(2);
    expect(emailService.sendTrialEndingEmail).toHaveBeenCalledWith('a@b.com', 'Ana', 3);
    expect(emailService.sendTrialEndingEmail).toHaveBeenCalledWith('c@d.com', 'Caio', 3);
  });

  it('keeps going when one e-mail fails', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', email: 'a@b.com', fullName: 'Ana', trialEndsAt: new Date(now.getTime() + 3 * DAY) },
      { id: 'u2', email: 'c@d.com', fullName: 'Caio', trialEndsAt: new Date(now.getTime() + 3 * DAY) },
    ]);
    emailService.sendTrialEndingEmail.mockRejectedValueOnce(new Error('resend down'));

    const sent = await service.sendTrialEndingReminders(now);

    expect(sent).toBe(1);
    expect(emailService.sendTrialEndingEmail).toHaveBeenCalledTimes(2);
  });
});
