import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService, hashToken } from './auth.service';

const DAY = 24 * 60 * 60 * 1000;

describe('AuthService', () => {
  let prisma: any;
  let usersService: any;
  let emailService: any;
  let service: AuthService;
  let verifiedUser: any;

  beforeEach(async () => {
    verifiedUser = {
      id: 'u1',
      email: 'a@b.com',
      fullName: 'Ana',
      role: 'MANAGER',
      passwordHash: await bcrypt.hash('senha-atual', 4),
      emailVerified: true,
      subscriptionStatus: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 10 * DAY),
      authProvider: 'LOCAL',
      googleId: null,
    };
    prisma = {
      user: {
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'new', ...data })),
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) => ({ ...verifiedUser, ...data })),
      },
    };
    usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(verifiedUser),
      setPassword: jest.fn(),
    };
    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    };
    const configService = { get: jest.fn().mockReturnValue(undefined) } as any;
    service = new AuthService(
      prisma,
      usersService,
      { sign: jest.fn().mockReturnValue('jwt') } as any,
      configService,
      emailService,
    );
  });

  describe('login', () => {
    it('rejects an unknown e-mail', async () => {
      await expect(service.login({ email: 'x@b.com', password: 'qualquer' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(verifiedUser);

      await expect(service.login({ email: 'a@b.com', password: 'errada' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an account that has not confirmed its e-mail', async () => {
      usersService.findByEmail.mockResolvedValue({ ...verifiedUser, emailVerified: false });

      await expect(service.login({ email: 'a@b.com', password: 'senha-atual' })).rejects.toThrow(
        /Confirme seu e-mail/,
      );
    });

    it('tells Google-only accounts to use the Google button', async () => {
      usersService.findByEmail.mockResolvedValue({ ...verifiedUser, passwordHash: null });

      await expect(service.login({ email: 'a@b.com', password: 'senha-atual' })).rejects.toThrow(
        /Google/,
      );
    });

    it('returns a token and the public user on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(verifiedUser);

      const result = await service.login({ email: 'a@b.com', password: 'senha-atual' });

      expect(result.access_token).toBe('jwt');
      expect(result.user).toMatchObject({
        id: 'u1',
        email: 'a@b.com',
        role: 'MANAGER',
        subscriptionStatus: 'TRIAL',
      });
      expect((result.user as any).passwordHash).toBeUndefined();
    });
  });

  describe('signup', () => {
    it('refuses a duplicated e-mail', async () => {
      usersService.findByEmail.mockResolvedValue(verifiedUser);

      await expect(
        service.signup({ email: 'A@b.com', password: 'senha-forte', fullName: 'Ana' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates an unverified trial account, stores only the token hash and e-mails the raw token', async () => {
      const result = await service.signup({
        email: ' Nova@Empresa.com ',
        password: 'senha-forte',
        fullName: ' Nova Pessoa ',
      });

      const data = prisma.user.create.mock.calls[0][0].data;
      expect(data.email).toBe('nova@empresa.com');
      expect(data.fullName).toBe('Nova Pessoa');
      expect(data.emailVerified).toBe(false);
      expect(data.subscriptionStatus).toBe('TRIAL');
      const trialDays = (data.trialEndsAt.getTime() - Date.now()) / DAY;
      expect(trialDays).toBeGreaterThan(29.9);
      expect(trialDays).toBeLessThanOrEqual(30);

      const [to, rawToken, name] = emailService.sendVerificationEmail.mock.calls[0];
      expect(to).toBe('nova@empresa.com');
      expect(name).toBe('Nova Pessoa');
      expect(rawToken).toHaveLength(64);
      expect(data.verificationToken).toBe(hashToken(rawToken));
      expect(data.verificationToken).not.toBe(rawToken);
      expect(result.email).toBe('nova@empresa.com');
    });
  });

  describe('verifyEmail', () => {
    it('rejects an unknown or expired token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('nope')).rejects.toThrow(BadRequestException);
      await expect(service.verifyEmail('')).rejects.toThrow(BadRequestException);
    });

    it('looks the token up by its hash, marks the account verified and logs the user in', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...verifiedUser, emailVerified: false });

      const result = await service.verifyEmail('token-1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ verificationToken: hashToken('token-1') }),
        }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { emailVerified: true, verificationToken: null, verificationTokenExpires: null },
        }),
      );
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith('a@b.com', 'Ana');
      expect(result.access_token).toBe('jwt');
    });
  });

  describe('forgotPassword', () => {
    it('answers the same way for unknown e-mails and sends nothing', async () => {
      const result = await service.forgotPassword('x@b.com');

      expect(result.message).toMatch(/Se existir uma conta/);
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('sends nothing for Google-only accounts', async () => {
      usersService.findByEmail.mockResolvedValue({ ...verifiedUser, passwordHash: null });

      await service.forgotPassword('a@b.com');

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('stores the reset token hash and e-mails the raw token', async () => {
      usersService.findByEmail.mockResolvedValue(verifiedUser);

      await service.forgotPassword('a@b.com');

      const data = prisma.user.update.mock.calls[0][0].data;
      const [, rawToken] = emailService.sendPasswordResetEmail.mock.calls[0];
      expect(rawToken).toHaveLength(64);
      expect(data.resetToken).toBe(hashToken(rawToken));
      expect(data.resetTokenExpiry.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('resetPassword', () => {
    it('rejects an invalid token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.resetPassword('bad', 'nova-senha-123')).rejects.toThrow(BadRequestException);
    });

    it('hashes the new password and clears the token', async () => {
      prisma.user.findFirst.mockResolvedValue(verifiedUser);

      await service.resetPassword('token-1', 'nova-senha-123');

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ resetToken: hashToken('token-1') }) }),
      );
      const data = prisma.user.update.mock.calls[0][0].data;
      expect(await bcrypt.compare('nova-senha-123', data.passwordHash)).toBe(true);
      expect(data.resetToken).toBeNull();
      expect(data.emailVerified).toBe(true);
    });
  });

  describe('googleAuth', () => {
    it('fails clearly when GOOGLE_CLIENT_ID is not configured', async () => {
      await expect(service.googleAuth({ idToken: 'x' })).rejects.toThrow(/não está configurado/);
    });
  });

  describe('changePassword', () => {
    it('changes the password when the current one matches', async () => {
      await service.changePassword('u1', { currentPassword: 'senha-atual', newPassword: 'nova-senha-123' });

      expect(usersService.setPassword).toHaveBeenCalledWith('u1', 'nova-senha-123');
    });

    it('refuses to change the password when the current one is wrong', async () => {
      await expect(
        service.changePassword('u1', { currentPassword: 'errada', newPassword: 'nova-senha-123' }),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.setPassword).not.toHaveBeenCalled();
    });

    it('refuses to reuse the current password', async () => {
      await expect(
        service.changePassword('u1', { currentPassword: 'senha-atual', newPassword: 'senha-atual' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lets a Google-only account define its first password', async () => {
      usersService.findById.mockResolvedValue({ ...verifiedUser, passwordHash: null });

      await service.changePassword('u1', { currentPassword: '', newPassword: 'primeira-senha' });

      expect(usersService.setPassword).toHaveBeenCalledWith('u1', 'primeira-senha');
    });
  });
});
