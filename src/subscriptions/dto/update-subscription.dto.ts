import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Plan, Status } from '../../../generated/prisma/enums';

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
