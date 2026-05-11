import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

import { JwtUtil } from '../common/utils/jwt.util';
import { OtpUtil } from '../common/utils/otp.util';
import { MailService } from '../common/services/mail.service';
import { AppError } from '../common/utils/error.util';

type LoginContext = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtUtil: JwtUtil,
    private otpUtil: OtpUtil,
    private mailService: MailService,
  ) {}

  private async createLoginLog(
    email: string,
    success: boolean,
    context: LoginContext,
    userId?: string,
  ) {
    await this.prisma.loginLog.create({
      data: {
        email,
        success,
        userId,
        ip: context.ip,
        userAgent: context.userAgent,
      },
    });
  }

  private async generateAndStoreOtp(userId: string, email: string) {
    const otp = this.otpUtil.generateOtp();
    const otpExpiry = this.otpUtil.generateExpiry(10);
    const otpHash = await bcrypt.hash(otp, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { otp: otpHash, otpExpiry },
    });

    await this.mailService.sendOtpEmail(email, otp);
  }

  private issueTokens(user: {
    id: string;
    email: string;
    role: { name: string };
  }) {
    const accessToken = this.jwtUtil.generateToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        tokenType: 'access',
      },
      '15m',
    );

    const refreshToken = this.jwtUtil.generateToken(
      { sub: user.id, tokenType: 'refresh' },
      '7d',
    );

    return { accessToken, refreshToken };
  }

  private async ensureAdminSubscription(userId: string, roleName: string) {
    if (roleName !== 'ADMIN') {
      return;
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!existing) {
      await this.prisma.subscription.create({
        data: {
          userId,
          plan: 'PROFESSIONAL',
          status: 'ACTIVE',
        },
      });
    }
  }

  private buildUserResponse(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: { name: string };
    subscription?: {
      plan: string;
      status: string;
      expiresAt: Date | null;
    } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      subscription: user.subscription
        ? {
            plan: user.subscription.plan,
            status: user.subscription.status,
            expiresAt: user.subscription.expiresAt,
            isActive:
              user.subscription.status === 'ACTIVE' &&
              (!user.subscription.expiresAt ||
                new Date(user.subscription.expiresAt) > new Date()),
          }
        : undefined,
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) AppError.badRequest('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const viewerRole = await this.prisma.role.findUnique({
      where: { name: 'VIEWER' },
    });

    if (!viewerRole) AppError.badRequest('Default role not found');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: viewerRole.id,
        isActive: false,
      },
    });

    await this.generateAndStoreOtp(user.id, dto.email);

    return {
      success: true,
      message: 'Registration successful. Please check your email for OTP.',
      email: dto.email,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user || !user.otp || !user.otpExpiry) {
      AppError.badRequest('Invalid verification request');
    }

    const otpMatches = await bcrypt.compare(dto.otp, user.otp || '');
    if (!otpMatches) AppError.badRequest('Invalid OTP');
    if (this.otpUtil.isExpired(user.otpExpiry))
      AppError.badRequest('OTP has expired');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        isActive: true,
        otp: null,
        otpExpiry: null,
      },
    });

    return {
      success: true,
      message: 'Email verified successfully. You can now login.',
    };
  }

  async login(dto: LoginDto, context: LoginContext = {}) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true, subscription: true },
    });

    if (!user) {
      await this.createLoginLog(dto.email, false, context);
      AppError.unauthorized('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      await this.createLoginLog(dto.email, false, context, user.id);
      AppError.unauthorized('Invalid email or password');
    }

    if (!user.isVerified) {
      await this.generateAndStoreOtp(user.id, user.email);
      await this.createLoginLog(user.email, false, context, user.id);
      AppError.unauthorized('Please verify your email first');
    }

    if (!user.isActive) {
      await this.createLoginLog(user.email, false, context, user.id);
      AppError.unauthorized('Account is deactivated');
    }

    await this.ensureAdminSubscription(user.id, user.role.name);

    const latestSubscription = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    const { accessToken, refreshToken } = this.issueTokens(user);
    await this.createLoginLog(user.email, true, context, user.id);

    return {
      success: true,
      accessToken,
      refreshToken,
      user: this.buildUserResponse({
        ...user,
        subscription: latestSubscription,
      }),
    };
  }

  logout() {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtUtil.verifyToken(refreshToken) as {
        sub: string;
        tokenType?: string;
      };

      if (payload.tokenType !== 'refresh') {
        AppError.unauthorized('Invalid refresh token');
      }

      const userId = payload.sub;
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true, subscription: true },
      });

      if (!user) AppError.unauthorized('Invalid refresh token');

      const { accessToken: newAccess, refreshToken: newRefresh } =
        this.issueTokens(user);

      return {
        success: true,
        accessToken: newAccess,
        refreshToken: newRefresh,
      };
    } catch {
      AppError.unauthorized('Invalid refresh token');
    }
  }
}
