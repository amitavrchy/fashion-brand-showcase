import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  type RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { PaymentsService } from './payments.service.js';
import { SessionService } from './auth.js';

@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(PaymentsService) private payments: PaymentsService,
    @Inject(SessionService) private session: SessionService,
  ) {}
  @Get('checkout/:sessionId')
  @Throttle({ default: { limit: 90, ttl: 60_000 } })
  async status(@Param('sessionId') id: string, @Req() req: Request) {
    return this.payments.status(id, req, await this.session.user(req));
  }
  @Post('cancel/:orderId') @HttpCode(200) async cancel(
    @Param('orderId') id: string,
    @Req() req: Request,
  ) {
    return this.payments.cancel(id, req, await this.session.user(req));
  }
  @Post('webhook') @HttpCode(200) @SkipThrottle() webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody || !signature)
      throw new BadRequestException('A signed Stripe payload is required.');
    return this.payments.webhook(req.rawBody, signature);
  }
}
