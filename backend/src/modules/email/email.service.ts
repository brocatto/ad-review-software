import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null;
  private emailFrom: string;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    // Without a key (local dev) e-mails are logged instead of sent
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.emailFrom = this.configService.get<string>('EMAIL_FROM', 'noreply@example.com');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  /** Sends through Resend, or logs the message (with its links) when no API key is configured. */
  private async deliver(payload: { from: string; to: string; subject: string; html: string }) {
    if (!this.resend) {
      const links = [...payload.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      this.logger.log(
        `[dev] E-mail para ${payload.to}: "${payload.subject}"${links.length ? ` — links: ${links.join(' ')}` : ''}`,
      );
      return { data: { id: 'logged' }, error: null };
    }
    return this.resend.emails.send(payload);
  }

  async sendVerificationEmail(email: string, token: string, fullName: string): Promise<boolean> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    try {
      const { data, error } = await this.deliver({
        from: this.emailFrom,
        to: email,
        subject: 'Confirme seu e-mail - AdReviewOS',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #1a1a1a;
                color: #ffffff;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
              }
              h1 {
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 16px 0;
              }
              p {
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.6;
                margin: 0 0 24px 0;
              }
              .button {
                display: inline-block;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 16px;
                font-weight: 600;
                font-size: 14px;
              }
              .footer {
                margin-top: 32px;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.4);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Olá, ${fullName}!</h1>
                <p>Obrigado por se cadastrar. Por favor, verifique seu email clicando no botão abaixo:</p>
                <a href="${verificationUrl}" class="button">Verificar Email</a>
                <p class="footer">
                  Se você não criou uma conta, ignore este email.<br>
                  Este link expira em 24 horas.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send verification email to ${email}:`, error);
        return false;
      }

      this.logger.log(`Verification email sent to ${email}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending verification email to ${email}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    try {
      const { data, error } = await this.deliver({
        from: this.emailFrom,
        to: email,
        subject: 'Bem-vindo ao AdReviewOS!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #1a1a1a;
                color: #ffffff;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
              }
              h1 {
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 16px 0;
              }
              p {
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.6;
                margin: 0 0 24px 0;
              }
              .button {
                display: inline-block;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 16px;
                font-weight: 600;
                font-size: 14px;
              }
              ul {
                color: rgba(255, 255, 255, 0.7);
                padding-left: 20px;
                margin: 0 0 24px 0;
              }
              li {
                margin-bottom: 8px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Bem-vindo, ${fullName}!</h1>
                <p>Sua conta foi verificada com sucesso. Agora você tem acesso ao período de teste gratuito de 30 dias!</p>
                <p>Com o AdReviewOS você pode:</p>
                <ul>
                  <li>Criar lotes de criativos para aprovação</li>
                  <li>Compartilhar links com clientes</li>
                  <li>Receber feedback em tempo real</li>
                  <li>Gerenciar revisões facilmente</li>
                </ul>
                <a href="${this.frontendUrl}/dashboard" class="button">Acessar Dashboard</a>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send welcome email to ${email}:`, error);
        return false;
      }

      this.logger.log(`Welcome email sent to ${email}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${email}:`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, token: string, fullName: string): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    try {
      const { data, error } = await this.deliver({
        from: this.emailFrom,
        to: email,
        subject: 'Redefinir senha - AdReviewOS',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #1a1a1a;
                color: #ffffff;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
              }
              h1 {
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 16px 0;
              }
              p {
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.6;
                margin: 0 0 24px 0;
              }
              .button {
                display: inline-block;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 16px;
                font-weight: 600;
                font-size: 14px;
              }
              .footer {
                margin-top: 32px;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.4);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Redefinir senha</h1>
                <p>Olá ${fullName}, recebemos uma solicitação para redefinir sua senha.</p>
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
                <p class="footer">
                  Se você não solicitou a redefinição de senha, ignore este email.<br>
                  Este link expira em 1 hora.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send password reset email to ${email}:`, error);
        return false;
      }

      this.logger.log(`Password reset email sent to ${email}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending password reset email to ${email}:`, error);
      return false;
    }
  }

  async sendPaymentSuccessEmail(email: string, fullName: string, amount: number, planName: string): Promise<boolean> {
    try {
      const { data, error } = await this.deliver({
        from: this.emailFrom,
        to: email,
        subject: 'Pagamento Confirmado - AdReviewOS',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #1a1a1a;
                color: #ffffff;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
              }
              h1 {
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 16px 0;
              }
              p {
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.6;
                margin: 0 0 24px 0;
              }
              .amount {
                font-size: 32px;
                font-weight: 600;
                color: #4ade80;
                margin: 16px 0;
              }
              .button {
                display: inline-block;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 16px;
                font-weight: 600;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Pagamento Confirmado!</h1>
                <p>Olá ${fullName},</p>
                <p>Seu pagamento foi processado com sucesso.</p>
                <div class="amount">$${(amount / 100).toFixed(2)}</div>
                <p>Plano: ${planName}</p>
                <p>Obrigado pela sua assinatura!</p>
                <a href="${this.frontendUrl}/billing" class="button">Ver Detalhes da Assinatura</a>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send payment success email to ${email}:`, error);
        return false;
      }

      this.logger.log(`Payment success email sent to ${email}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending payment success email to ${email}:`, error);
      return false;
    }
  }

  async sendPaymentFailedEmail(email: string, fullName: string): Promise<boolean> {
    try {
      const { data, error } = await this.deliver({
        from: this.emailFrom,
        to: email,
        subject: 'Falha no Pagamento - Ação Necessária',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #1a1a1a;
                color: #ffffff;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
              }
              h1 {
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 16px 0;
                color: #ef4444;
              }
              p {
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.6;
                margin: 0 0 24px 0;
              }
              .button {
                display: inline-block;
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.4);
                color: #ffffff;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 16px;
                font-weight: 600;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Falha no Pagamento</h1>
                <p>Olá ${fullName},</p>
                <p>Não foi possível processar seu pagamento. Por favor, atualize seu método de pagamento para continuar usando o AdReviewOS.</p>
                <p>Se precisar de assistência, entre em contato com nossa equipe de suporte.</p>
                <a href="${this.frontendUrl}/billing" class="button">Atualizar Método de Pagamento</a>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send payment failed email to ${email}:`, error);
        return false;
      }

      this.logger.log(`Payment failed email sent to ${email}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending payment failed email to ${email}:`, error);
      return false;
    }
  }

  async sendSubscriptionCanceledEmail(email: string, fullName: string, endDate: Date): Promise<boolean> {
    try {
      const { data, error } = await this.deliver({
        from: this.emailFrom,
        to: email,
        subject: 'Assinatura Cancelada - AdReviewOS',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #1a1a1a;
                color: #ffffff;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
              }
              h1 {
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 16px 0;
              }
              p {
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.6;
                margin: 0 0 24px 0;
              }
              .date {
                font-size: 18px;
                font-weight: 600;
                color: #f59e0b;
                margin: 16px 0;
              }
              .button {
                display: inline-block;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 16px;
                font-weight: 600;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Assinatura Cancelada</h1>
                <p>Olá ${fullName},</p>
                <p>Sua assinatura foi cancelada. Você continuará tendo acesso até:</p>
                <div class="date">${endDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}</div>
                <p>Sentimos sua saída! Se mudar de ideia, você pode reativar sua assinatura a qualquer momento.</p>
                <a href="${this.frontendUrl}/billing" class="button">Reativar Assinatura</a>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send subscription canceled email to ${email}:`, error);
        return false;
      }

      this.logger.log(`Subscription canceled email sent to ${email}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending subscription canceled email to ${email}:`, error);
      return false;
    }
  }

  async sendTrialEndingEmail(email: string, fullName: string, daysLeft: number): Promise<boolean> {
    try {
      const { data, error } = await this.deliver({
        from: this.emailFrom,
        to: email,
        subject: `Seu teste termina em ${daysLeft} dias - AdReviewOS`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #1a1a1a;
                color: #ffffff;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
              }
              h1 {
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 16px 0;
              }
              p {
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.6;
                margin: 0 0 24px 0;
              }
              .days {
                font-size: 48px;
                font-weight: 600;
                color: #f59e0b;
                margin: 16px 0;
              }
              .button {
                display: inline-block;
                background: rgba(74, 222, 128, 0.2);
                border: 1px solid rgba(74, 222, 128, 0.4);
                color: #ffffff;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 16px;
                font-weight: 600;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Seu Teste Está Terminando</h1>
                <p>Olá ${fullName},</p>
                <p>Seu período de teste gratuito terminará em:</p>
                <div class="days">${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}</div>
                <p>Assine agora para continuar usando todos os recursos do AdReviewOS sem interrupções.</p>
                <a href="${this.frontendUrl}/billing" class="button">Assinar Agora</a>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send trial ending email to ${email}:`, error);
        return false;
      }

      this.logger.log(`Trial ending email sent to ${email}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending trial ending email to ${email}:`, error);
      return false;
    }
  }
}
