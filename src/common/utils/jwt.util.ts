import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtUtil {
    constructor(private configService: ConfigService) { }

    generateToken(payload: object, expiresIn?: string): string {
        const secret = this.configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const tokenExpiresIn = (expiresIn || this.configService.get<string>('JWT_EXPIRATION') || '7d') as jwt.SignOptions['expiresIn'];
        return jwt.sign(payload, secret, {
            expiresIn: tokenExpiresIn,
        });
    }

    verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.configService.get<string>('JWT_SECRET')!);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}