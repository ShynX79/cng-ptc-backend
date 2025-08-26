import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateReadingDto {
    @ApiProperty({ example: 'CUST-001' }) @IsString() @IsNotEmpty() customer_code: string;
    @ApiProperty({ example: 'STG-A-01' }) @IsString() @IsNotEmpty() storage_number: string;
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' }) @IsUUID() @IsNotEmpty() operator_id: string;
    @ApiProperty({ example: 1500.5 }) @IsNumber() psi: number;
    @ApiProperty({ example: 25.5 }) @IsNumber() temp: number;
    @ApiProperty({ example: 1450.0 }) @IsNumber() psi_out: number;
    @ApiProperty({ example: 120.7 }) @IsNumber() flow_turbine: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() remarks?: string;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() fixed_storage_quantity?: number;

    // input waktu manual (opsional) → dibulatkan ke jam terdekat (UTC)
    @ApiProperty({
        example: '2025-08-21T13:40:00.000Z',
        required: false,
        description: 'Waktu pembacaan manual (opsional, akan dibulatkan ke jam terdekat)',
    })
    @IsDateString()
    @IsOptional()
    manual_created_at?: string;
}
