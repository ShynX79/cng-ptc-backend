// src/readings/dto/dumping-reading.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Matches } from 'class-validator';

export class CreateDumpingDto {
    @ApiProperty() @IsString() @IsNotEmpty() customer_code: string;
    @ApiProperty() @IsString() @IsNotEmpty() source_storage_number: string;
    @ApiProperty() @IsString() @IsNotEmpty() destination_storage_number: string;
    @ApiProperty() @IsNumber() source_psi_before: number;
    @ApiProperty() @IsNumber() source_psi_after: number;
    @ApiProperty() @IsNumber() source_temp_before: number;
    @ApiProperty() @IsNumber() source_temp_after: number;
    @ApiProperty() @IsNumber() destination_psi_after: number;
    @ApiProperty() @IsNumber() destination_temp: number;
    @ApiProperty() @IsNumber() flow_turbine_before: number;
    @ApiProperty() @IsNumber() flow_turbine_after: number;
    @ApiProperty() @IsNumber() psi_out: number;

    @ApiProperty({ example: '06:05' })
    @IsString() @IsNotEmpty() @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    time_before: string;

    @ApiProperty({ example: '06:14' })
    @IsString() @IsNotEmpty() @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    time_after: string;
}