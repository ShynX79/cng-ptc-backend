import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private supabaseAdmin: SupabaseClient;

    constructor(private readonly configService: ConfigService) { }

    /**
     * Mengembalikan Supabase client.
     * Jika token diberikan, client akan diautentikasi untuk pengguna tersebut.
     * Jika tidak, client generik yang akan dikembalikan.
     * @param token - JWT opsional milik pengguna
     */
    getClient(token?: string): SupabaseClient {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        // [FIXED] Menggunakan SUPABASE_ANON_KEY agar konsisten dengan app.module.ts
        const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be defined');
        }

        if (token) {
            return createClient(supabaseUrl, supabaseKey, {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            });
        }

        return createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Mengembalikan Supabase client dengan hak akses admin (service_role).
     * Gunakan ini untuk operasi yang melewati RLS.
     */
    getAdminClient(): SupabaseClient {
        if (this.supabaseAdmin) {
            return this.supabaseAdmin;
        }

        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined');
        }

        this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        return this.supabaseAdmin;
    }
}
