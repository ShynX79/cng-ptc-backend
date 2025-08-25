import { Global, Module } from '@nestjs/common'; // <-- Impor @Global
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Global() // <-- [FIXED] Tambahkan dekorator ini
@Module({
    imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1d' },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, SupabaseService, JwtStrategy],
    exports: [AuthService, PassportModule],
})
export class AuthModule { }
