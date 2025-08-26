import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsDateString } from 'class-validator';

export class PerformDumpingDto {
    @ApiProperty({
        description: 'Nomor storage yang di-refill (dumping)',
        example: '1013',
    })
    @IsString()
    @IsNotEmpty()
    dumpingStorageNumber: string;

    @ApiProperty({
        description: 'PSI awal di storage dumping sebelum refill',
        example: 2900,
    })
    @IsNumber()
    @IsNotEmpty()
    startPsi: number;

    @ApiProperty({
        description: 'PSI akhir di storage dumping setelah refill',
        example: 2100,
    })
    @IsNumber()
    @IsNotEmpty()
    endPsi: number;

    @ApiProperty({
        description: 'Waktu selesai proses dumping (ISO string)',
        example: '2025-08-01T17:15:00.000Z',
    })
    @IsDateString()
    @IsNotEmpty()
    endTimestamp: string;
}