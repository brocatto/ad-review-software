import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../config/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignupDto, GoogleAuthDto } from './dto/signup.dto';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h
const DEFAULT_TRIAL_DAYS = 30;

const randomToken = () => crypto.randomBytes(32).toString('hex');
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

interface AuthUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: string;
  emailVerified: boolean;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClientId?: string;
  private readonly googleClient?: OAuth2Client;
  readonly trialPeriodDays: number;

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID') || undefined;
    this.googleClient = this.googleClientId ? new OAuth2Client(this.googleClientId) : undefined;
    this.trialPeriodDays =
      Number(this.configService.get<string>('TRIAL_PERIOD_DAYS')) || DEFAULT_TRIAL_DAYS;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Esta conta usa login com Google. Entre pelo botão do Google.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.');
    }

    return this.buildAuthResponse(user);
  }

  /** Self-service signup: account starts a trial and must confirm the e-mail before logging in. */
  async signup(dto: SignupDto) {
    const email = normalizeEmail(dto.email);
    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('Já existe uma conta com este e-mail');
    }

    const verificationToken = randomToken();
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        fullName: dto.fullName.trim(),
        authProvider: 'LOCAL',
        emailVerified: false,
        verificationToken,
        verificationTokenExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
        ...this.trialFields(),
      },
    });

    await this.emailService.sendVerificationEmail(user.email, verificationToken, user.fullName);

    return {
      message: 'Conta criada. Enviamos um link de confirmação para o seu e-mail.',
      email: user.email,
    };
  }

  async verifyEmail(token: string) {
    const user = token
      ? await this.prisma.user.findFirst({
          where: { verificationToken: token, verificationTokenExpires: { gt: new Date() } },
        })
      : null;

    if (!user) {
      throw new BadRequestException('Link de confirmação inválido ou expirado');
    }

    const verified = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationTokenExpires: null },
    });

    await this.emailService.sendWelcomeEmail(verified.email, verified.fullName);

    return this.buildAuthResponse(verified);
  }

  async resendVerification(email: string) {
    // Same answer whether or not the account exists, so e-mails can't be enumerated
    const generic = { message: 'Se o e-mail existir e ainda não estiver confirmado, enviamos um novo link.' };

    const user = await this.usersService.findByEmail(email);
    if (!user || user.emailVerified) {
      return generic;
    }

    const verificationToken = randomToken();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationTokenExpires: new Date(Date.now() + VERIFICATION_TTL_MS) },
    });

    await this.emailService.sendVerificationEmail(user.email, verificationToken, user.fullName);
    return generic;
  }

  /** Google Identity Services: verifies the ID token, links or creates the account. */
  async googleAuth(dto: GoogleAuthDto) {
    if (!this.googleClient || !this.googleClientId) {
      throw new BadRequestException('Login com Google não está configurado neste ambiente');
    }

    let payload: { email?: string; sub?: string; name?: string; email_verified?: boolean } | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: this.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (error) {
      this.logger.warn(`Google token rejected: ${(error as Error).message}`);
      throw new UnauthorizedException('Não foi possível autenticar com o Google');
    }

    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Não foi possível autenticar com o Google');
    }
    if (payload.email_verified === false) {
      throw new UnauthorizedException('Sua conta Google não tem e-mail verificado');
    }

    const email = normalizeEmail(payload.email);
    const googleId = payload.sub;

    let user = await this.prisma.user.findFirst({ where: { OR: [{ googleId }, { email }] } });

    if (user) {
      // Link an existing e-mail/password account to Google (e-mail is verified by Google)
      if (user.googleId !== googleId || !user.emailVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            emailVerified: true,
            authProvider: user.passwordHash ? user.authProvider : 'GOOGLE',
          },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          googleId,
          fullName: payload.name?.trim() || email.split('@')[0],
          authProvider: 'GOOGLE',
          emailVerified: true,
          ...this.trialFields(),
        },
      });
      await this.emailService.sendWelcomeEmail(user.email, user.fullName);
    }

    return this.buildAuthResponse(user);
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async forgotPassword(email: string) {
    const generic = { message: 'Se existir uma conta com este e-mail, enviamos um link para redefinir a senha.' };

    const user = await this.usersService.findByEmail(email);
    // Google-only accounts have no password to reset
    if (!user || !user.passwordHash) {
      return generic;
    }

    const resetToken = randomToken();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: new Date(Date.now() + RESET_TTL_MS) },
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.fullName);
    return generic;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = token
      ? await this.prisma.user.findFirst({
          where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
        })
      : null;

    if (!user) {
      throw new BadRequestException('Link de redefinição inválido ou expirado');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10),
        resetToken: null,
        resetTokenExpiry: null,
        // Reaching the e-mailed link proves ownership of the address
        emailVerified: true,
      },
    });

    return { message: 'Senha redefinida com sucesso' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    // Google-only accounts define their first password here; others must prove the current one
    if (user.passwordHash && !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Senha atual incorreta');
    }
    if (user.passwordHash && dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da atual');
    }

    await this.usersService.setPassword(userId, dto.newPassword);
    return { success: true };
  }

  private trialFields() {
    return {
      trialEndsAt: new Date(Date.now() + this.trialPeriodDays * 24 * 60 * 60 * 1000),
      subscriptionStatus: 'TRIAL',
    };
  }

  private buildAuthResponse(user: AuthUserRecord) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: user.emailVerified,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
      },
    };
  }
}
