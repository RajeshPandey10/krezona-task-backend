import { Controller, Get, Param, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.logsService.findByUserId(user.id);
  }

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
