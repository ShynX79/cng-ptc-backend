import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn } from 'class-validator';

export class CreateProfileDto {
    @ApiProperty({ example: 'operator_baru', description: 'Username unik untuk operator' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'operator.baru@example.com', description: 'Email aktif untuk login' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'strongpassword123', description: 'Password minimal 8 karakter' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    // Peran (role) dibuat statis sebagai 'operator' karena endpoint ini khusus untuk membuat operator
    @ApiProperty({ example: 'operator', description: 'Peran pengguna', default: 'operator', readOnly: true })
    @IsIn(['operator'])
    role: string = 'operator';
}