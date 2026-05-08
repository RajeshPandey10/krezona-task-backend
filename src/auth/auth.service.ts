import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtUtil } from '../common/utils/jwt.util';
import { AppError } from '../common/utils/error.util';

@Injectable()
export class AuthService {
  private jwtUtil: JwtUtil;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.jwtUtil = new JwtUtil( configService);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      AppError.badRequest('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const engineerRole = await this.prisma.role.findUnique({
      where: { name: 'ENGINEER' },
    });

    if (!engineerRole) {
      AppError.badRequest('Default role (ENGINEER) not found. Please seed roles first.');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: engineerRole!.id,
      },
    });

    await this.prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE_TRIAL',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { success: true, message: 'User registered successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user) {
      AppError.unauthorized('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user!.password);
    if (!isValidPassword) {
      AppError.unauthorized('Invalid email or password');
    }

    if (!user!.isActive) {
      AppError.unauthorized('Your account has been deactivated');
    }

    const payload = {
      sub: user!.id,
      email: user!.email,
      role: user!.role.name,
    };

    const accessToken = this.jwtUtil.generateToken(payload);

    return {
      success: true,
      accessToken,
      user: {
        id: user!.id,
        email: user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
        role: user!.role.name,
      },
    };
  }
}