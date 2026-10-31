import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdminController, ShopController } from './shop.controller.js';
import { AdminGuard, SessionGuard, SessionService } from './auth.js';
import { ShopService } from './shop.service.js';
import { StripeGateway } from './stripe.gateway.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import {
  ContentController,
  PublicContentController,
} from './content.controller.js';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32 || secret.startsWith('replace-'))
          throw new Error(
            'Set JWT_SECRET to a random secret of at least 32 characters.',
          );
        return {
          secret,
          signOptions: {
            expiresIn: '7d',
            issuer: 'atelier-lune',
            audience: 'atelier-lune-client',
          },
          verifyOptions: {
            issuer: 'atelier-lune',
            audience: 'atelier-lune-client',
          },
        };
      },
    }),
  ],
  controllers: [
    ShopController,
    AdminController,
    PaymentsController,
    ContentController,
    PublicContentController,
  ],
  providers: [
    ShopService,
    SessionService,
    SessionGuard,
    AdminGuard,
    StripeGateway,
    PaymentsService,
  ],
})
export class ShopModule {}
