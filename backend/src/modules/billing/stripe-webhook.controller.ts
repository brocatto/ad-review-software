import { Controller, Post, Headers, Req, RawBodyRequest, BadRequestException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { BillingService } from './billing.service';

/**
 * POST /webhooks/stripe — configure this URL in the Stripe dashboard with the events
 * checkout.session.completed, customer.subscription.*, invoice.payment_succeeded/failed.
 * No JWT: authenticity comes from the Stripe signature over the raw body (main.ts rawBody).
 */
@Controller('webhooks')
@SkipThrottle()
export class StripeWebhookController {
  constructor(private billingService: BillingService) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Raw body is required for webhook verification');
    }
    return this.billingService.handleWebhook(signature || '', req.rawBody);
  }
}
