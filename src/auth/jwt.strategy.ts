import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET tidak terdefinisi di environment variables');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: any) {
        this.logger.log(`Validating user from JWT payload: ${JSON.stringify(payload)}`);

        // [FIXED] Menggunakan payload.sub untuk ID, sesuai dengan standar JWT dan payload yang dibuat di AuthService.
        // Juga menyertakan email untuk kelengkapan data pengguna.
        return { id: payload.sub, email: payload.email, role: payload.role };
    }
}
