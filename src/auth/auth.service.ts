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
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) AppError.badRequest('Email already registered');

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const engineerRole = await this.prisma.role.findUnique({
            where: { name: 'ENGINEER' },
        });

        if (!engineerRole) AppError.badRequest('Default role not found');

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                firstName: dto.firstName,
                lastName: dto.lastName,
                roleId: engineerRole.id,
                isActive: false,
                isVerified: false,
            },
        });

        const otp = this.otpUtil.generateOtp();
        const otpExpiry = this.otpUtil.generateExpiry(10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: { otp, otpExpiry },
        });

        await this.mailService.sendOtpEmail(dto.email, otp);

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

        if (user.otp !== dto.otp) AppError.badRequest('Invalid OTP');
        if (this.otpUtil.isExpired(user.otpExpiry)) AppError.badRequest('OTP has expired');

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                isActive: true,
                otp: null,
                otpExpiry: null,
            },
        });

        return { success: true, message: 'Email verified successfully. You can now login.' };
    }

    async login(dto: LoginDto, context: LoginContext = {}) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { role: true },
        });

        if (!user) {
            await this.prisma.loginLog.create({
                data: {
                    email: dto.email,
                    success: false,
                    ip: context.ip,
                    userAgent: context.userAgent,
                },
            });
            AppError.unauthorized('Invalid email or password');
        }

        const passwordMatches = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatches) {
            await this.prisma.loginLog.create({
                data: {
                    email: dto.email,
                    userId: user.id,
                    success: false,
                    ip: context.ip,
                    userAgent: context.userAgent,
                },
            });
            AppError.unauthorized('Invalid email or password');
        }

        if (!user.isVerified) {
            const otp = this.otpUtil.generateOtp();
            const otpExpiry = this.otpUtil.generateExpiry(10);

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    otp,
                    otpExpiry,
                },
            });

            await this.mailService.sendOtpEmail(user.email, otp);

            await this.prisma.loginLog.create({
                data: {
                    email: user.email,
                    userId: user.id,
                    success: false,
                    ip: context.ip,
                    userAgent: context.userAgent,
                },
            });
            AppError.unauthorized('Please verify your email first');
        }

        if (!user.isActive) {
            await this.prisma.loginLog.create({
                data: {
                    email: user.email,
                    userId: user.id,
                    success: false,
                    ip: context.ip,
                    userAgent: context.userAgent,
                },
            });
            AppError.unauthorized('Account is deactivated');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role.name,
        };

        const accessToken = this.jwtUtil.generateToken(payload);

        await this.prisma.loginLog.create({
            data: {
                email: user.email,
                userId: user.id,
                success: true,
                ip: context.ip,
                userAgent: context.userAgent,
            },
        });

        return {
            success: true,
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name,
            },
        };
    }

    async logout() {
        return {
            success: true,
            message: 'Logged out successfully',
        };
    }
}