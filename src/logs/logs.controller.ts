import { Controller, Get, Param, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('logs')
export class LogsController {
    constructor(private readonly logsService: LogsService) { }

    @Roles('ADMIN')
    @Get()
    findAll(@Query('userId') userId?: string) {
        return this.logsService.findAll(userId);
    }

    @Roles('ADMIN')
    @Get(':userId')
    findByUserId(@Param('userId') userId: string) {
        return this.logsService.findByUserId(userId);
    }
}
