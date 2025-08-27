import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn } from 'class-validator';

export class CreateProfileDto {
    @ApiProperty({ example: 'operator_baru', description: 'Username unik untuk pengguna' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'pengguna.baru@example.com', description: 'Email aktif untuk login' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'strongpassword123', description: 'Password minimal 8 karakter' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @ApiProperty({
        example: 'operator',
        description: 'Peran pengguna',
        enum: ['admin', 'operator'],
    })
    @IsString()
    @IsNotEmpty()
    @IsIn(['admin', 'operator'], { message: 'Role must be either "admin" or "operator"' })
    role: string;
}