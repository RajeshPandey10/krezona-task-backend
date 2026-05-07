import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ProjectsModule } from './projects/projects.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [AuthModule, UsersModule, RolesModule, ProjectsModule, SubscriptionsModule, AdminModule, LogsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
