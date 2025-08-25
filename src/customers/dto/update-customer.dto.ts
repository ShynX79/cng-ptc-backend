import { ApiProperty as ApiPropertyUpdate } from '@nestjs/swagger'; // Alias to avoid conflict
import { IsString as IsStringUpdate, IsOptional as IsOptionalUpdate } from 'class-validator'; // Alias to avoid conflict

export class UpdateCustomerDto {
    @ApiPropertyUpdate({ example: 'PT. Maju Jaya', required: false })
    @IsStringUpdate()
    @IsOptionalUpdate()
    name?: string;
}