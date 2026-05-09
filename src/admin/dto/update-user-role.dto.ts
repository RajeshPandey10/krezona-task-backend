import { IsOptional, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  roleName?: string;
}
