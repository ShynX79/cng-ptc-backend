import { Module as ModuleProfile } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { SupabaseModule } from '../supabase/supabase.module';

@ModuleProfile({
    imports: [SupabaseModule],
    controllers: [ProfilesController],
    providers: [ProfilesService],
})
export class ProfilesModule { }