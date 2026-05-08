import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
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
    constructor(private readonly adminService: AdminService) { }

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
    createUser(@Body() dto: CreateUserDto) {
        return this.adminService.createUser(dto);
    }

    @Roles('ADMIN')
    @Patch('users/:id')
    updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.adminService.updateUser(id, dto);
    }

    @Roles('ADMIN')
    @Patch('users/:id/role')
    updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
        return this.adminService.updateUserRole(id, dto);
    }

    @Roles('ADMIN')
    @Delete('users/:id')
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
    createRole(@Body() dto: CreateRoleDto) {
        return this.adminService.createRole(dto);
    }

    @Roles('ADMIN')
    @Patch('roles/:id')
    updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
        return this.adminService.updateRole(id, dto);
    }

    @Roles('ADMIN')
    @Delete('roles/:id')
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
    @Patch('subscriptions/:userId')
    updateSubscriptionForUser(@Param('userId') userId: string, @Body() dto: UpdateSubscriptionDto) {
        return this.adminService.updateSubscriptionForUser(userId, dto);
    }

    @Roles('ADMIN')
    @Patch('subscriptions/:userId/activate')
    activateSubscription(@Param('userId') userId: string) {
        return this.adminService.activateSubscription(userId);
    }

    @Roles('ADMIN')
    @Patch('subscriptions/:userId/deactivate')
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
