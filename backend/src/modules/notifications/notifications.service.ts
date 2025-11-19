import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SlackService } from './slack.service';
import {
  BatchNotificationData,
  BatchSentNotificationData,
} from './interfaces/batch-notification.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly frontendUrl: string;

  constructor(
    private slackService: SlackService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  private getBatchLink(batchId: string): string {
    return `<${this.frontendUrl}/batches/${batchId}|Ver lote>`;
  }

  async notifyBatchSent(data: BatchSentNotificationData): Promise<void> {
    const link = this.getBatchLink(data.batchId);
    const message = [
      `📦 *Novo lote enviado*`,
      `Lote: ${data.batchName} | Cliente: ${data.clientName} | Criativos: ${data.creativesCount}`,
      link,
    ].join('\n');

    await this.slackService.sendMessage(message);
    this.logger.log(`Batch sent notification: ${data.batchName}`);
  }

  async notifyBatchCompleted(data: BatchNotificationData): Promise<void> {
    if (data.status !== 'COMPLETED') {
      return;
    }

    const link = this.getBatchLink(data.batchId);
    let message: string;

    if (data.rejectedCount === 0) {
      // 100% approved
      message = [
        `✅ *Revisão concluída - 100% aprovado*`,
        `Lote: ${data.batchName} | Cliente: ${data.clientName} | Aprovados: ${data.approvedCount}/${data.totalCreatives}`,
        link,
      ].join('\n');
    } else {
      // Has rejections - needs adjustments
      message = [
        `⚠️ *Revisão concluída - Ajustes necessários*`,
        `Lote: ${data.batchName} | Cliente: ${data.clientName} | Aprovados: ${data.approvedCount} | Rejeitados: ${data.rejectedCount}`,
        link,
      ].join('\n');
    }

    await this.slackService.sendMessage(message);
    this.logger.log(`Batch completed notification: ${data.batchName} (${data.rejectedCount} rejections)`);
  }
}
