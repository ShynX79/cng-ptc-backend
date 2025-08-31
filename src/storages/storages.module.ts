import { Module } from '@nestjs/common';
import { StoragesController } from './storages.controller';
import { StoragesService } from './storages.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
    imports: [ SupabaseModule ],
    controllers: [StoragesController],
    providers: [StoragesService],
})
export class StoragesModule { }