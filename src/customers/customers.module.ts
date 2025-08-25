// ================================================================
// FILE: src/customers/customers.module.ts
// ================================================================
import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        SupabaseModule,
        AuthModule
    ],
    controllers: [CustomersController],
    providers: [CustomersService],
})
export class CustomersModule { }