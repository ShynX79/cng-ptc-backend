import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProfilesService {
    constructor(private readonly supabaseService: SupabaseService) { }

    // Menggunakan getAdminClient untuk konsistensi dan bypass RLS jika diperlukan
    private get supabase() {
        return this.supabaseService.getAdminClient();
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            // Jika error karena data tidak ditemukan, berikan pesan yang jelas
            if (error.code === 'PGRST116') {
                throw new NotFoundException(`Profile with ID "${id}" not found.`);
            }
            // Untuk error database lainnya
            throw new InternalServerErrorException(error.message);
        }

        if (!data) {
            throw new NotFoundException(`Profile with ID "${id}" not found.`);
        }

        return data;
    }
}
