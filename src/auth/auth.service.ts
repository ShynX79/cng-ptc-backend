import { Injectable, BadRequestException, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async getProfile(user: any) {
        const userId = user.id;
        const { data: profile, error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            throw new NotFoundException(`Profile for user ID ${userId} not found.`);
        }
        return profile;
    }

    async loginWithEmail(email: string, password: string) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error || !data.user || !data.session) {
            throw new UnauthorizedException('Kredensial login tidak valid');
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            throw new UnauthorizedException('Profil pengguna tidak ditemukan');
        }

        return {
            message: 'Login berhasil',
            user: { id: data.user.id, email: data.user.email, username: profile.username, role: profile.role },
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
        };
    }

    async logout(token: string) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new InternalServerErrorException('Supabase URL or Key is not configured.');
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const { error } = await supabase.auth.signOut();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Logout berhasil' };
    }
}