import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

type BrevoConfig = { apiKey: string };

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private useBrevo = false;
  private brevoConfig: BrevoConfig | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const brevoKey = this.configService.get<string>('BREVO_API_KEY');

    this.fromEmail =
      this.configService.get<string>('EMAIL_USER') || 'no-reply@example.com';

    if (brevoKey) {
      this.useBrevo = true;
      this.brevoConfig = { apiKey: brevoKey };
    } else {
      // fallback to local SMTP (for development)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get<string>('EMAIL_USER'),
          pass: this.configService.get<string>('EMAIL_PASS'),
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });
    }
  }

  async sendOtpEmail(email: string, otp: string) {
    const subject = 'Your Verification OTP - Civil Engineer PM';
    const html = `
        <h2>Email Verification</h2>
        <p>Your OTP for registration is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `;
    const text = `Your OTP for registration is: ${otp}. It will expire in 10 minutes.`;

    if (this.useBrevo && this.brevoConfig) {
      try {
        const url = 'https://api.brevo.com/v3/smtp/email';
        const payload = {
          sender: { name: 'Civil Engineer PM', email: this.fromEmail },
          to: [{ email }],
          subject,
          htmlContent: html,
          textContent: text,
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.brevoConfig.apiKey,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error('Brevo send failed', {
            status: res.status,
            body: errBody,
          });
          throw new Error(`Brevo error: ${res.status}`);
        }
        return;
      } catch (err) {
        console.error('Failed to send OTP via Brevo', { to: email, err });
        throw err;
      }
    }

    if (!this.transporter) {
      const err = new Error('No mail transporter configured');

      console.error(err.message);
      throw err;
    }

    const mailOptions = {
      from: `"Civil Engineer PM" <${this.fromEmail}>`,
      to: email,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('Failed to send OTP email via SMTP', { to: email, err });
      throw err;
    }
  }
}
