import { Module as ModuleProfile } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module'; // <-- DITAMBAHKAN

@ModuleProfile({
    imports: [
        SupabaseModule,
        AuthModule // <-- DITAMBAHKAN
    ],
    controllers: [ProfilesController],
    providers: [ProfilesService],
})
export class ProfilesModule { }
