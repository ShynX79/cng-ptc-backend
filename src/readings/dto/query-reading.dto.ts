import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class QueryReadingDto {
    @ApiPropertyOptional({ description: 'Filter by customer code', default: 'all' }) @IsString() @IsOptional() customer?: string;
    @ApiPropertyOptional({ description: 'Filter by operator username', default: 'all' }) @IsString() @IsOptional() operator?: string;
    @ApiPropertyOptional({ description: 'Search term for customer or operator' }) @IsString() @IsOptional() searchTerm?: string;
    @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'asc' }) @IsIn(['asc', 'desc']) @IsOptional() sortOrder?: 'asc' | 'desc';
}
