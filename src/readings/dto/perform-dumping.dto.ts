import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsDateString } from 'class-validator';

export class PerformDumpingDto {
    @ApiProperty({
        description: 'Nomor storage sementara yang digunakan untuk dumping/isi ulang',
        example: '1013',
    })
    @IsString()
    @IsNotEmpty()
    dumpingStorageNumber: string;

    @ApiProperty({
        description: 'Pressure (PSI) dari storage sementara di awal proses',
        example: 2900,
    })
    @IsNumber()
    @IsNotEmpty()
    startPsi: number;

    @ApiProperty({
        description: 'Pressure (PSI) dari storage sementara di akhir proses',
        example: 2100,
    })
    @IsNumber()
    @IsNotEmpty()
    endPsi: number;

    @ApiProperty({
        description: 'Waktu selesai proses dumping',
        example: '2025-08-01T17:15:00.000Z',
    })
    @IsDateString()
    @IsNotEmpty()
    endTimestamp: string;
}
