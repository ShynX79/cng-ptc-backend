import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCustomerDto {
    @ApiProperty({ example: 'CUST-001' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ example: 'PT. Maju Mundur', required: false })
    @IsString()
    @IsOptional()
    name?: string;
}

