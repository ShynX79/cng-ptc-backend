// src/readings/dto/stop-reading.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Matches } from 'class-validator';

export class CreateStopDto {
    @ApiProperty({ example: 'CUST-001' })
    @IsString()
    @IsNotEmpty()
    customer_code: string;

    @ApiProperty({ example: 'STG-A-01' })
    @IsString()
    @IsNotEmpty()
    storage_number: string;

    @ApiProperty({ example: 1363 })
    @IsNumber()
    psi: number;

    @ApiProperty({ example: 442502 })
    @IsNumber()
    flow_turbine: number;

    @ApiProperty({ example: 'Sesi Laporan Selesai.' })
    @IsString()
    remarks?: string;

    @ApiProperty({ example: '16:00', description: 'Waktu pencatatan aktual (HH:mm)' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format waktu tidak valid. Gunakan HH:mm' })
    manual_created_at: string;
}