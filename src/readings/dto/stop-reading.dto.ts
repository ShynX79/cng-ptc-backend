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

    @ApiProperty({ example: 1363, description: 'Tekanan dalam satuan PSI' })
    @IsNumber()
    psi: number;

    @ApiProperty({ example: 35.6, description: 'Temperatur dalam °C' })
    @IsNumber()
    temp: number;

    @ApiProperty({ example: 7.5, description: 'Tekanan keluar dalam satuan Bar' })
    @IsNumber()
    psi_out: number;

    @ApiProperty({ example: 442502, description: 'Flow meter / turbin' })
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