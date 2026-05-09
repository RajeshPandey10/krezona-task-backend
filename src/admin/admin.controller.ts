import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateSubscriptionDto } from '../subscriptions/dto/update-subscription.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles('ADMIN')
  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Roles('ADMIN')
  @Get('users')
  findUsers() {
    return this.adminService.findUsers();
  }

  @Roles('ADMIN')
  @Get('users/:id')
  findUserById(@Param('id') id: string) {
    return this.adminService.findUserById(id);
  }

  @Roles('ADMIN')
  @Post('users')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Roles('ADMIN')
  @Patch('users/:id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Roles('ADMIN')
  @Patch('users/:id/role')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto);
  }

  @Roles('ADMIN')
  @Delete('users/:id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  removeUser(@Param('id') id: string) {
    return this.adminService.removeUser(id);
  }

  @Roles('ADMIN')
  @Get('roles')
  findRoles() {
    return this.adminService.findRoles();
  }

  @Roles('ADMIN')
  @Post('roles')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createRole(@Body() dto: CreateRoleDto) {
    return this.adminService.createRole(dto);
  }

  @Roles('ADMIN')
  @Patch('roles/:id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateRole(id, dto);
  }

  @Roles('ADMIN')
  @Delete('roles/:id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  removeRole(@Param('id') id: string) {
    return this.adminService.removeRole(id);
  }

  @Roles('ADMIN')
  @Get('subscriptions')
  findSubscriptions() {
    return this.adminService.findSubscriptions();
  }

  @Roles('ADMIN')
  @Get('subscriptions/:userId')
  findSubscriptionByUserId(@Param('userId') userId: string) {
    return this.adminService.findSubscriptionByUserId(userId);
  }

  @Roles('ADMIN')
  @Post('subscriptions/:userId')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  createSubscriptionForUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.adminService.updateSubscriptionForUser(userId, dto);
  }

  @Roles('ADMIN')
  @Patch('subscriptions/:userId')
  @Throttle({ default: { limit: 25, ttl: 60000 } })
  updateSubscriptionForUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.adminService.updateSubscriptionForUser(userId, dto);
  }

  @Roles('ADMIN')
  @Patch('subscriptions/:userId/activate')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  activateSubscription(@Param('userId') userId: string) {
    return this.adminService.activateSubscription(userId);
  }

  @Roles('ADMIN')
  @Patch('subscriptions/:userId/deactivate')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  deactivateSubscription(@Param('userId') userId: string) {
    return this.adminService.deactivateSubscription(userId);
  }

  @Roles('ADMIN')
  @Get('logs')
  findLogs() {
    return this.adminService.findLogs();
  }

  @Roles('ADMIN')
  @Get('logs/:userId')
  findLogsByUserId(@Param('userId') userId: string) {
    return this.adminService.findLogs(userId);
  }
}
