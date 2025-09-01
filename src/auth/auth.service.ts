import { Injectable, BadRequestException, UnauthorizedException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    // Tambahkan logger untuk debugging
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        // --- BLOK DEBUGGING UNTUK MEMVERIFIKASI KONEKSI .env ---
        const url = this.configService.get<string>('SUPABASE_URL');
        const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        this.logger.debug(`[ENV] Supabase URL Loaded: ${url}`);
        this.logger.debug(`[ENV] Supabase Service Key Loaded: ${serviceKey ? '*** KEY DITEMUKAN ***' : '!!! KEY TIDAK DITEMUKAN / UNDEFINED !!!'}`);
        // --- AKHIR BLOK DEBUGGING ---
    }

    async getProfile(user: any) {
        // ... (kode getProfile Anda tidak perlu diubah)
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
            // Log error asli dari Supabase untuk debugging
            this.logger.error('Login failed:', error?.message);
            throw new UnauthorizedException('Kredensial login tidak valid');
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            this.logger.error(`Profile not found for user ${data.user.id}`, profileError?.message);
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
        // ... (kode logout Anda tidak perlu diubah)
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

