import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { AccountService } from './account.service.js';
import { TokenService } from './token.service.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RateLimitScope } from '../../common/decorators/rate-limit-scope.decorator.js';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard.js';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard.js';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../common/constants/auth.constants.js';

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If an account exists for that email address, a password reset link has been sent.';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountService: AccountService,
    private readonly tokenService: TokenService,
  ) {}

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimitScope('auth')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return { admin: result.admin };
  }

  @Public()
  @UseGuards(RefreshTokenGuard, RateLimitGuard)
  @RateLimitScope('auth')
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate access and refresh tokens' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.tokenService.rotate(
      (req as Request & { refreshToken?: string }).refreshToken,
      {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    );

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return { message: 'Tokens refreshed' };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token and clear cookies' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.tokenService.revoke(req.cookies?.[REFRESH_TOKEN_COOKIE]);

    res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions());

    return { message: 'Logged out' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated admin' })
  async me(@CurrentUser('id') adminId: string) {
    return this.authService.me(adminId);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimitScope('verification')
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an email address with a token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.accountService.verifyEmail(dto.token);
  }

  @UseGuards(RateLimitGuard)
  @RateLimitScope('verification')
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a new email verification link' })
  async resendVerification(@CurrentUser('id') adminId: string) {
    await this.accountService.requestEmailVerification(adminId);

    return { message: 'Verification email sent' };
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimitScope('password')
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.accountService.forgotPassword(dto.email);

    return { message: GENERIC_FORGOT_PASSWORD_MESSAGE };
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimitScope('password')
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.accountService.resetPassword(dto.token, dto.password);

    return { message: 'Password updated' };
  }

  @UseGuards(RateLimitGuard)
  @RateLimitScope('password')
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the password of the current admin' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @CurrentUser('id') adminId: string,
  ) {
    await this.accountService.changePassword(
      adminId,
      dto.currentPassword,
      dto.newPassword,
      req.cookies?.[REFRESH_TOKEN_COOKIE],
    );

    return { message: 'Password changed' };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...this.cookieOptions(),
      maxAge: ACCESS_TOKEN_TTL_MS,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...this.cookieOptions(),
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  private cookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSite =
      (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none' | undefined) ??
      (isProduction ? 'none' : 'lax');

    return {
      httpOnly: true,
      secure: isProduction || sameSite === 'none',
      sameSite,
      path: '/',
    };
  }
}
