import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Roles('ADMIN')
    @Get('dashboard')
    dashboard() {
        return this.adminService.dashboard();
    }
}
