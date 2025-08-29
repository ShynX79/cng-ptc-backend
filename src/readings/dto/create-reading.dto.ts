import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Matches } from 'class-validator';

export class CreateReadingDto {
    @ApiProperty({ example: 'CUST-001' }) @IsString() @IsNotEmpty() customer_code: string;
    @ApiProperty({ example: 'STG-A-01' }) @IsString() @IsNotEmpty() storage_number: string;
    @ApiProperty({ example: 1500.5 }) @IsNumber() psi: number;
    @ApiProperty({ example: 25.5 }) @IsNumber() temp: number;
    @ApiProperty({ example: 1450.0 }) @IsNumber() psi_out: number;
    @ApiProperty({ example: 120.7 }) @IsNumber() flow_turbine: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() remarks?: string;
    @ApiProperty({ example: 4, required: true }) @IsNumber() @IsNotEmpty() fixed_storage_quantity: number;
    @ApiProperty({ example: '13:45', required: true, description: 'Waktu pencatatan aktual dari form (HH:mm)' })
    @IsString() @IsNotEmpty() @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format waktu tidak valid. Gunakan HH:mm' })
    manual_created_at: string;
}
