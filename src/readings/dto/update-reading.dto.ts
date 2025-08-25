import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

// DTO ini hanya berisi field yang boleh diubah oleh pengguna.
export class UpdateReadingDto {
    @ApiProperty({ example: 1450.5, required: false })
    @IsNumber()
    @IsOptional()
    psi?: number;

    @ApiProperty({ example: 26.0, required: false })
    @IsNumber()
    @IsOptional()
    temp?: number;

    @ApiProperty({ example: 1400.0, required: false })
    @IsNumber()
    @IsOptional()
    psi_out?: number;

    @ApiProperty({ example: 125.0, required: false })
    @IsNumber()
    @IsOptional()
    flow_turbine?: number;

    @ApiProperty({ example: 'Kondisi normal', required: false })
    @IsString()
    @IsOptional()
    remarks?: string;
}
