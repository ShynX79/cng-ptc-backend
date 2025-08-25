import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module'; // <-- DITAMBAHKAN

@Module({
    imports: [
        SupabaseModule,
        AuthModule // <-- DITAMBAHKAN: Agar bisa menggunakan JwtAuthGuard
    ],
    controllers: [CustomersController],
    providers: [CustomersService],
})
export class CustomersModule { }
