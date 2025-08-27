import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'operator_baru_revised', description: 'Username baru (opsional)' })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiPropertyOptional({ example: 'newstrongpassword123', description: 'Password baru minimal 8 karakter (opsional)' })
    @IsString()
    @IsOptional()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password?: string;
}