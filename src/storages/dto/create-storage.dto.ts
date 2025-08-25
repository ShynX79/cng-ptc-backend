// FILE: src/storages/dto/create-storage.dto.ts
import { ApiProperty as ApiPropertyStorage } from '@nestjs/swagger';
import { IsString as IsStringStorage, IsNotEmpty as IsNotEmptyStorage, IsOptional as IsOptionalStorage, IsInt as IsIntStorage } from 'class-validator';

export class CreateStorageDto {
    @ApiPropertyStorage({ example: 'STG-A-01' })
    @IsStringStorage()
    @IsNotEmptyStorage()
    storage_number: string;

    @ApiPropertyStorage({ example: 'mobile', required: false, default: 'mobile' })
    @IsStringStorage()
    @IsOptionalStorage()
    type?: string;

    @ApiPropertyStorage({ example: 'CUST-001', required: false })
    @IsStringStorage()
    @IsOptionalStorage()
    customer_code?: string;

    @ApiPropertyStorage({ example: 1000, required: false })
    @IsIntStorage()
    @IsOptionalStorage()
    default_quantity?: number;
}