import { IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    name!: string;

    @IsString()
    type!: string;

    @IsOptional()
    @IsString()
    description?: string;
}