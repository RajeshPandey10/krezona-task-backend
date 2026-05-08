import { BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';

export class AppError {

    static badRequest(message: string, details?: any) {
        throw new BadRequestException({
            success: false,
            message,
            details,
            timestamp: new Date().toISOString(),
        });
    }

    static unauthorized(message: string = 'Unauthorized access') {
        throw new UnauthorizedException({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        });
    }

    static forbidden(message: string = 'You do not have permission to access this resource') {
        throw new ForbiddenException({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        });
    }

    static notFound(message: string = 'Resource not found') {
        throw new NotFoundException({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        });
    }

    static custom(statusCode: number, message: string, details?: any) {
        throw new Error(message); // Will be caught by global exception filter later
    }
}