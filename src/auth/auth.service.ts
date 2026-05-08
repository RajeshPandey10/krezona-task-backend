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
        //verify otp and activate user
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

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { role: true },
        });

        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            AppError.unauthorized('Invalid email or password');
        }

        if (!user.isVerified) AppError.unauthorized('Please verify your email first');
        if (!user.isActive) AppError.unauthorized('Account is deactivated');

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role.name,
        };

        const accessToken = this.jwtUtil.generateToken(payload);

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
}