
// ================================================================
// FILE: src/customers/dto/update-customer.dto.ts
// ================================================================
import { ApiProperty as ApiPropertyUpdate } from '@nestjs/swagger';
import { IsString as IsStringUpdate, IsOptional as IsOptionalUpdate } from 'class-validator';

export class UpdateCustomerDto {
    @ApiPropertyUpdate({ example: 'PT. Maju Jaya', required: false })
    @IsStringUpdate()
    @IsOptionalUpdate()
    name?: string;
}
