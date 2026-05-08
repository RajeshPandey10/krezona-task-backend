import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from '../database/database.module';

import { JwtUtil } from '../common/utils/jwt.util';
import { OtpUtil } from '../common/utils/otp.util';

import { MailService } from '../common/services/mail.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, JwtUtil, OtpUtil, MailService, JwtAuthGuard],
  exports: [AuthService, JwtUtil],
})
export class AuthModule { }
