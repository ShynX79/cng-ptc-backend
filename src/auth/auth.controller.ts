import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { LoginDto, RegisterOperatorDto } from './dto/auth.dto';
import { LogoutDto } from './dto/logout.dto'; // <-- Impor DTO baru

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(200)
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: 200,
        description: 'Login berhasil',
    })
    async login(@Body() body: LoginDto) {
        return this.authService.loginWithEmail(body.email, body.password);
    }

    @Post('register/operator')
    @ApiResponse({
        status: 201,
        description: 'Operator berhasil didaftarkan',
    })
    async registerOperator(@Body() body: RegisterOperatorDto) {
        return this.authService.registerOperator(
            body.adminToken,
            body.username,
            body.email,
            body.password,
        );
    }

    // [FIXED] Logika Logout Diubah
    @Post('logout')
    @HttpCode(200)
    @ApiBody({ type: LogoutDto }) // <-- Gunakan DTO baru untuk Swagger
    @ApiResponse({ status: 200, description: 'Logout berhasil' })
    // Guard dan @Request() dihapus karena kita tidak lagi bergantung pada header
    async logout(@Body() logoutDto: LogoutDto) {
        // Mengirimkan token dari body ke service
        return this.authService.logout(logoutDto.accessToken);
    }
}
