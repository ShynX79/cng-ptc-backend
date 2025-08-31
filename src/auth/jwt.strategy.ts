import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(
        configService: ConfigService,
        private readonly supabaseService: SupabaseService, 
    ) {
        const secret = configService.get<string>('SUPABASE_JWT_SECRET');
        if (!secret) {
            throw new Error('SUPABASE_JWT_SECRET is not defined');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: any) {
        this.logger.log(`Validating user from JWT payload: ${JSON.stringify(payload)}`);
        
        if (!payload.sub) {
            throw new UnauthorizedException('Invalid token payload');
        }

        const userId = payload.sub;
        const supabase = this.supabaseService.getAdminClient();
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (!profile) {
            throw new UnauthorizedException('User profile not found.');
        }

        return { id: payload.sub, email: payload.email, role: profile.role };
    }
}