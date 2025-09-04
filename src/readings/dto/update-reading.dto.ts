import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsISO8601 } from 'class-validator';

export class UpdateReadingDto {
    @ApiProperty({ example: 1450.5, required: false }) @IsNumber() @IsOptional() psi?: number;
    @ApiProperty({ example: 26.0, required: false }) @IsNumber() @IsOptional() temp?: number;
    @ApiProperty({ example: 1400.0, required: false }) @IsNumber() @IsOptional() psi_out?: number;
    @ApiProperty({ example: 125.0, required: false }) @IsNumber() @IsOptional() flow_turbine?: number;
    @ApiProperty({ example: 'Kondisi normal', required: false }) @IsString() @IsOptional() remarks?: string;
    @ApiProperty({ example: 'STG-B-02', required: false }) @IsString() @IsOptional() storage_number?: string;
    @ApiProperty({ example: 1, required: false }) @IsNumber() @IsOptional() fixed_storage_quantity?: number;
    @ApiProperty({ example: '2025-09-03T14:30:00.000Z', required: false, description: 'Waktu pencatatan (Admin Only)' })
    @IsISO8601()
    @IsOptional()
    recorded_at?: string;
}
