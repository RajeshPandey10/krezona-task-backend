import { BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';

export class AppError {

    static badRequest(message: string, details?: any): never {
        throw new BadRequestException({
            success: false,
            message,
            details,
            timestamp: new Date().toISOString(),
        });
    }

    static unauthorized(message: string = 'Unauthorized access'): never {
        throw new UnauthorizedException({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        });
    }

    static forbidden(message: string = 'You do not have permission to access this resource'): never {
        throw new ForbiddenException({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        });
    }

    static notFound(message: string = 'Resource not found'): never {
        throw new NotFoundException({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        });
    }

    static custom(statusCode: number, message: string, details?: any): never {
        throw new Error(message); // Will be caught by global exception filter later
    }
}