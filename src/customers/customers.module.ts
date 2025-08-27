// backend-api-nest/src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
    imports: [ SupabaseModule ],
    controllers: [CustomersController],
    providers: [CustomersService],
})
export class CustomersModule { }