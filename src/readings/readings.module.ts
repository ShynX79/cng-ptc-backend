import { Module } from '@nestjs/common';
import { ReadingsController } from './readings.controller';
import { ReadingsService } from './readings.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module'; // <-- DITAMBAHKAN

@Module({
    imports: [
        SupabaseModule,
        AuthModule // <-- DITAMBAHKAN
    ],
    controllers: [ReadingsController],
    providers: [ReadingsService],
})
export class ReadingsModule { }
