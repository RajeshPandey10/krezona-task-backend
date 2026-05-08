import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireSubscription } from '../common/decorators/subscription.decorator';

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Roles('ADMIN', 'ENGINEER')
    @RequireSubscription('FREE_TRIAL', 'PROFESSIONAL', 'ENTERPRISE')
    @Post()
    create(@Body() dto: CreateProjectDto, @CurrentUser() user: any) {
        return this.projectsService.create(dto, user.id);
    }

    @Get()
    findAll(@Query('creatorId') creatorId?: string, @Query('role') role?: string) {
        return this.projectsService.findAll({ creatorId, role });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.projectsService.findOne(id);
    }

    @Roles('ADMIN', 'ENGINEER')
    @RequireSubscription('FREE_TRIAL', 'PROFESSIONAL', 'ENTERPRISE')
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
        return this.projectsService.update(id, dto);
    }

    @Roles('ADMIN', 'ENGINEER')
    @RequireSubscription('FREE_TRIAL', 'PROFESSIONAL', 'ENTERPRISE')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.projectsService.remove(id);
    }
}
