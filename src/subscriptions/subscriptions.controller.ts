import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Roles('ADMIN')
  @Get(':userId')
  findByUserId(@Param('userId') userId: string) {
    return this.subscriptionsService.findByUserId(userId);
  }

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.findByUserId(user.id);
  }

  @Roles('ADMIN')
  @Post(':userId')
  createForUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.createForUser(userId, dto);
  }

  @Roles('ADMIN')
  @Patch(':userId')
  updateForUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.updateForUser(userId, dto);
  }

  @Roles('ADMIN')
  @Delete(':userId')
  remove(@Param('userId') userId: string) {
    return this.subscriptionsService.remove(userId);
  }
}
