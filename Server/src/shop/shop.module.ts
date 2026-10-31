import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdminController, ShopController } from './shop.controller.js';
import { AdminGuard, SessionGuard, SessionService } from './auth.js';
import { ShopService } from './shop.service.js';

@Module({
  imports: [PrismaModule, JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32 || secret.startsWith('replace-')) throw new Error('Set JWT_SECRET to a random secret of at least 32 characters.');
    return { secret, signOptions: { expiresIn: '7d', issuer: 'atelier-lune', audience: 'atelier-lune-client' }, verifyOptions: { issuer: 'atelier-lune', audience: 'atelier-lune-client' } };
  } })],
  controllers: [ShopController, AdminController],
  providers: [ShopService, SessionService, SessionGuard, AdminGuard],
})
export class ShopModule {}
