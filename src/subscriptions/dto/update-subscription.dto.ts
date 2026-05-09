import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Plan, Status } from '@prisma/client';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(Plan)
  plan?: Plan;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
