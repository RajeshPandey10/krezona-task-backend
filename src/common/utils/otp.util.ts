import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpUtil {
  generateOtp(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  generateExpiry(minutes: number = 10): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
  isExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
  }
}
