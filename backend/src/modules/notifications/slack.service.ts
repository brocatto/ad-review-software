import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly webhookUrl: string | undefined;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
    this.enabled = this.configService.get<string>('SLACK_ENABLED') === 'true';
  }

  async sendMessage(text: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug('Slack notifications disabled');
      return false;
    }

    if (!this.webhookUrl) {
      this.logger.warn('SLACK_WEBHOOK_URL not configured');
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        this.logger.error(`Slack API error: ${response.status} ${response.statusText}`);
        return false;
      }

      this.logger.debug('Slack message sent successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Slack message: ${error.message}`);
      return false;
    }
  }
}
