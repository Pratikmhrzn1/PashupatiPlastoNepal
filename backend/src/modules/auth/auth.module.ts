import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { AccountService } from './account.service.js';
import { AuthController } from './auth.controller.js';
import { TokenService } from './token.service.js';
import { JwtStrategy } from '../../common/strategies/jwt.strategy.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    ThrottlerModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AccountService, TokenService, JwtStrategy],
  exports: [AuthService, AccountService, TokenService],
})
export class AuthModule {}
