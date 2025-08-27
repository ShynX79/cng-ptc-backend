import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    ForbiddenException,
    ConflictException, // Import ConflictException
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PostgrestError } from '@supabase/supabase-js';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
    constructor(private readonly supabaseService: SupabaseService) { }

    private handleSupabaseError(error: PostgrestError | null, context: string): void {
        if (!error) return;
        console.error(`Supabase error in ${context}:`, error.message);
        if (error.code === '42501') {
            throw new ForbiddenException('You do not have permission to perform this action.');
        }
        if (error.code === 'PGRST116' || error.code === '20000') {
            throw new NotFoundException(`Profile not found.`);
        }
        // Kode '23505' adalah untuk pelanggaran unique constraint (misal: username atau email sudah ada)
        if (error.code === '23505') {
            throw new ConflictException('User with this email or username already exists.');
        }
        throw new InternalServerErrorException(error.message);
    }

    /**
     * Membuat user baru di Supabase Auth dan profilnya di tabel 'profiles'.
     * Hanya bisa dilakukan oleh Admin.
     */
    async create(createProfileDto: CreateProfileDto) {
        const supabaseAdmin = this.supabaseService.getAdminClient();

        // 1. Buat user di `auth.users`
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: createProfileDto.email,
            password: createProfileDto.password,
            email_confirm: true, // Langsung aktifkan email karena dibuat oleh admin
        });

        if (authError) {
            console.error('Supabase auth error:', authError.message);
            // Handle jika user sudah ada (meskipun handleSupabaseError juga menangani ini)
            if (authError.message.includes('User already registered')) {
                throw new ConflictException('A user with this email already exists.');
            }
            throw new InternalServerErrorException(authError.message);
        }

        // 2. Buat profil di tabel `profiles`
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authData.user.id, // Gunakan ID dari user yang baru dibuat
                username: createProfileDto.username,
                role: createProfileDto.role,
            });

        if (profileError) {
            // Jika pembuatan profil gagal, hapus user yang sudah terlanjur dibuat di auth
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            this.handleSupabaseError(profileError, 'create profile');
        }

        // Jangan kembalikan data password
        const { password, ...result } = createProfileDto;
        return { message: 'Operator created successfully.', user: { ...result, id: authData.user.id } };
    }

    /**
     * Mengambil semua profil pengguna.
     */
    async findAll(token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase.from('profiles').select('*');
        this.handleSupabaseError(error, 'findAll profiles');
        return data;
    }

    /**
     * Mengambil satu profil berdasarkan ID.
     */
    async findOne(id: string, token: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
        this.handleSupabaseError(error, `findOne profile: ${id}`);
        return data;
    }

    /**
     * Memperbarui profil pengguna (username dan password).
     */
    async update(id: string, updateProfileDto: UpdateProfileDto, token: string) {
        const supabaseAdmin = this.supabaseService.getAdminClient();

        // Update password di Supabase Auth jika ada
        if (updateProfileDto.password) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
                password: updateProfileDto.password,
            });
            if (authError) throw new InternalServerErrorException(authError.message);
        }

        // Update username di tabel profiles jika ada
        if (updateProfileDto.username) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ username: updateProfileDto.username })
                .eq('id', id);

            this.handleSupabaseError(profileError, `update profile username: ${id}`);
        }

        // Ambil data terbaru untuk dikembalikan
        return this.findOne(id, token);
    }

    /**
     * Menghapus pengguna dari Supabase Auth dan profilnya.
     */
    async remove(id: string) {
        const supabaseAdmin = this.supabaseService.getAdminClient();
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (error) {
            if (error.message.toLowerCase().includes('not found')) {
                throw new NotFoundException(`User with ID ${id} not found.`);
            }
            throw new InternalServerErrorException(error.message);
        }
    }
}