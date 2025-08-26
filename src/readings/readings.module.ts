import { Module } from '@nestjs/common';
import { ReadingsController } from './readings.controller';
import { ReadingsService } from './readings.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        SupabaseModule,
        AuthModule
    ],
    controllers: [ReadingsController],
    providers: [ReadingsService],
})
export class ReadingsModule { }