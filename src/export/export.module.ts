// src/export/export.module.ts

import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { SupabaseModule } from '../supabase/supabase.module'; // Impor SupabaseModule

@Module({
    imports: [SupabaseModule], // Kita butuh akses ke Supabase
    controllers: [ExportController],
    providers: [ExportService], // Sediakan ExportService
})
export class ExportModule { }
