import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Matches } from 'class-validator';

export class CreateChangeDto {
    @ApiProperty({ example: '505', description: 'Nomor storage LAMA (yang dilepas)' })
    @IsString() @IsNotEmpty() old_storage_number: string;
    @ApiProperty({ example: '503', description: 'Nomor storage BARU (yang dipasang)' })
    @IsString() @IsNotEmpty() new_storage_number: string;
    @ApiProperty({ example: 1150, description: 'PSI akhir dari storage LAMA' })
    @IsNumber() old_storage_final_psi: number;
    @ApiProperty({ example: 2900, description: 'PSI awal dari storage BARU' })
    @IsNumber() new_storage_initial_psi: number;
    @ApiProperty({ example: '17:05', description: 'Waktu saat proses pergantian (HH:mm)' })
    @IsString() @IsNotEmpty() @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format waktu tidak valid. Gunakan HH:mm' })
    time: string;
}
