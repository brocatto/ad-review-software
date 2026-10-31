import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Deliberately NOT behind SubscriptionGuard: users with an expired trial must reach these
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('checkout')
  async createCheckout(@Request() req: any) {
    return this.billingService.createCheckoutSession(req.user.id);
  }

  @Post('portal')
  async createPortal(@Request() req: any) {
    return this.billingService.createPortalSession(req.user.id);
  }

  @Get('status')
  async getStatus(@Request() req: any) {
    return this.billingService.getSubscriptionStatus(req.user);
  }
}
