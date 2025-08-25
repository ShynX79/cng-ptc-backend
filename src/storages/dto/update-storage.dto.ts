import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

// DTO ini berisi field yang boleh diubah oleh admin.
// Nomor storage (storage_number) tidak diizinkan untuk diubah.
export class UpdateStorageDto {
    @ApiProperty({ example: 'fixed', required: false, description: "Tipe storage ('mobile' atau 'fixed')" })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiProperty({ example: 'CUST-002', required: false, description: 'Kode customer pemilik (jika ada)' })
    @IsString()
    @IsOptional()
    customer_code?: string;

    @ApiProperty({ example: 1200, required: false, description: 'Kuantitas default (jika ada)' })
    @IsInt()
    @IsOptional()
    default_quantity?: number;
}
