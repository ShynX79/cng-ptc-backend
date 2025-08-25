import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly jwtService: JwtService,
    ) { }

    // [DITAMBAHKAN] Fungsi baru untuk mengambil profil berdasarkan data dari token
    async getProfile(user: any) {
        const userId = user.id; // Ambil ID dari payload token (misalnya, { id: '...', role: '...' })

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

        if (error || !data.user) {
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

        const payload = { sub: data.user.id, email: data.user.email, role: profile.role };
        const accessToken = this.jwtService.sign(payload);

        return {
            message: 'Login berhasil',
            user: { id: data.user.id, email: data.user.email, username: profile.username, role: profile.role },
            access_token: accessToken,
        };
    }

    async registerOperator(adminToken: string, username: string, email: string, password: string) {
        const payload: any = this.verifyAdminToken(adminToken);

        if (payload.role !== 'admin') {
            throw new ForbiddenException('Hanya admin yang dapat membuat akun operator');
        }

        const supabase = this.supabaseService.getAdminClient();

        const { data: signUpData, error } = await supabase.auth.signUp({ email, password });
        if (error || !signUpData.user) {
            throw new BadRequestException(error?.message || 'Pendaftaran gagal');
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({ id: signUpData.user.id, username, role: 'operator' })
            .select()
            .single();

        if (profileError) {
            await supabase.auth.admin.deleteUser(signUpData.user.id);
            throw new BadRequestException(profileError.message);
        }

        return profile;
    }

    verifyAdminToken(token: string) {
        try {
            return this.jwtService.verify(token);
        } catch {
            throw new UnauthorizedException('Token admin tidak valid');
        }
    }

    async logout(token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Logout berhasil' };
    }
}
