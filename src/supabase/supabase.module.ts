// FILE: src/supabase/supabase.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

@Module({
    imports: [ConfigModule],           // <<< biar bisa pakai ConfigService di SupabaseService
    providers: [SupabaseService],
    exports: [SupabaseService],        // <<< diexport supaya bisa dipakai module lain
})
export class SupabaseModule { }
