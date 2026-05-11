import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AppError } from '../common/utils/error.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private refreshCookieOptions(): CookieOptions {
    const secure = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    if (result.refreshToken) {
      res.cookie(
        'refresh_token',
        result.refreshToken,
        this.refreshCookieOptions(),
      );
    }

    return {
      success: result.success,
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as
      | Record<string, string | undefined>
      | undefined;
    const cookie = cookies?.refresh_token ?? '';
    if (!cookie) {
      AppError.unauthorized('Missing refresh token');
    }

    const newTokens = await this.authService.refresh(cookie);
    if (newTokens.refreshToken) {
      res.cookie(
        'refresh_token',
        newTokens.refreshToken,
        this.refreshCookieOptions(),
      );
    }
    return {
      success: newTokens.success,
      accessToken: newTokens.accessToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/' });
    return this.authService.logout();
  }
}
