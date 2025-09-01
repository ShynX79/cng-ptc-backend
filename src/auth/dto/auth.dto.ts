import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        description: 'Email pengguna yang terdaftar',
        example: 'dummyboyss05@gmail.com', // <-- Diubah sesuai permintaan
    })
    @IsEmail({}, { message: 'Format email tidak valid' })
    @IsNotEmpty({ message: 'Email tidak boleh kosong' })
    email: string;

    @ApiProperty({
        description: 'Password pengguna',
        example: 'admin1234', // <-- Diubah sesuai permintaan
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty({ message: 'Password tidak boleh kosong' })
    @MinLength(6, { message: 'Password minimal harus 6 karakter' })
    password: string;
}

