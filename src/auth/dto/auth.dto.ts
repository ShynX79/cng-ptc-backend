import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'dummyboyss05@gmail.com' })
    email: string;

    @ApiProperty({ example: 'admin1234' })
    password: string;
}

export class RegisterOperatorDto {
    @ApiProperty({ example: 'toti01' })
    username: string;

    @ApiProperty({ example: 'mtotikurniawan@gmail.com' })
    email: string;

    @ApiProperty({ example: 'toti123' })
    password: string;

    @ApiProperty({ example: '' })
    adminToken: string;
}
