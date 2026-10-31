import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ShopModule } from './shop/shop.module.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // Browser regression suites share one IP and make hundreds of rapid page visits.
    // Keep the production limit and endpoint-specific mutation limits intact.
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: process.env.NODE_ENV === 'test' ? 1200 : 120 },
    ]),
    ShopModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
