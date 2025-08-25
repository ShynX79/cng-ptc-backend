import { Controller, Post, Body, UseGuards, Request, HttpCode, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody, ApiResponse, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoginDto, RegisterOperatorDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // [DITAMBAHKAN] Endpoint baru untuk mendapatkan profil pengguna saat ini
    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get current user profile from token' })
    getProfile(@Request() req) {
        // req.user diisi secara otomatis oleh JwtAuthGuard dari payload token
        return this.authService.getProfile(req.user);
    }

    @Post('login')
    @HttpCode(200)
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Login berhasil' })
    async login(@Body() body: LoginDto) {
        return this.authService.loginWithEmail(body.email, body.password);
    }

    @Post('register/operator')
    @ApiResponse({ status: 201, description: 'Operator berhasil didaftarkan' })
    async registerOperator(@Body() body: RegisterOperatorDto) {
        return this.authService.registerOperator(
            body.adminToken,
            body.username,
            body.email,
            body.password,
        );
    }

    @Post('logout')
    @HttpCode(200)
    @ApiBody({ type: LogoutDto })
    @ApiResponse({ status: 200, description: 'Logout berhasil' })
    async logout(@Body() logoutDto: LogoutDto) {
        return this.authService.logout(logoutDto.accessToken);
    }
}
