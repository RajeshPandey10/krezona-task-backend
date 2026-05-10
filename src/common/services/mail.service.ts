import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendOtpEmail(email: string, otp: string) {
    const mailOptions = {
      from: `"Civil Engineer PM" <${this.configService.get('EMAIL_USER')}>`,
      to: email,
      subject: 'Your Verification OTP - Civil Engineer PM',
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP for registration is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (err) {

      console.error('Failed to send OTP email', { to: email, err });
      throw err;
    }
  }
}
