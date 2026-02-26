import { Controller, Post, Headers, Req, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';

@Controller('webhooks')
export class StripeWebhookController {
  constructor(private billingService: BillingService) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new Error('Raw body is required for webhook verification');
    }

    return this.billingService.handleWebhook(signature, rawBody);
  }
}
