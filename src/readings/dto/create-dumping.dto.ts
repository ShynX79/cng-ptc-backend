import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Matches } from 'class-validator';

export class CreateDumpingDto {
    @ApiProperty({ example: 'DP', description: 'Kode customer' }) @IsString() @IsNotEmpty() customer_code: string;
    @ApiProperty({ example: '503', description: 'Nomor storage SUMBER (yang memberi gas)' }) @IsString() @IsNotEmpty() source_storage_number: string;
    @ApiProperty({ example: '505', description: 'Nomor storage TUJUAN (yang menerima gas)' }) @IsString() @IsNotEmpty() destination_storage_number: string;
    @ApiProperty({ example: 2650, description: 'PSI awal dari storage SUMBER' }) @IsNumber() source_psi_before: number;
    @ApiProperty({ example: 2000, description: 'PSI sisa dari storage SUMBER setelah transfer' }) @IsNumber() source_psi_after: number;
    @ApiProperty({ example: 1150, description: 'PSI awal dari storage TUJUAN sebelum diisi' }) @IsNumber() destination_psi_before: number;
    @ApiProperty({ example: 1537, description: 'PSI baru dari storage TUJUAN setelah transfer' }) @IsNumber() destination_psi_after: number;
    @ApiProperty({ example: 32, description: 'Temperatur storage SUMBER SEBELUM proses' }) @IsNumber() source_temp_before: number;
    @ApiProperty({ example: 28, description: 'Temperatur storage SUMBER SETELAH proses' }) @IsNumber() source_temp_after: number;
    @ApiProperty({ example: 24, description: 'Temperatur storage TUJUAN' }) @IsNumber() destination_temp: number;
    @ApiProperty({ example: 440155, description: 'Nilai Flow Turbine SEBELUM proses' }) @IsNumber() flow_turbine_before: number;
    @ApiProperty({ example: 440173, description: 'Nilai Flow Turbine SETELAH proses' }) @IsNumber() flow_turbine_after: number;
    @ApiProperty({ example: 1, description: 'Pressure out saat proses dumping' }) @IsNumber() psi_out: number;
    @ApiProperty({ example: '17:05', description: 'Waktu SEBELUM proses dumping (HH:mm)' }) @IsString() @IsNotEmpty() @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format waktu tidak valid. Gunakan HH:mm' }) time_before: string;
    @ApiProperty({ example: '17:15', description: 'Waktu SETELAH proses dumping (HH:mm)' }) @IsString() @IsNotEmpty() @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format waktu tidak valid. Gunakan HH:mm' }) time_after: string;
}