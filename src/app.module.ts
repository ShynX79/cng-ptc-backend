import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

// Feature Modules
import { SupabaseModule } from './supabase/supabase.module';
import { CustomersModule } from './customers/customers.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ReadingsModule } from './readings/readings.module';
import { StoragesModule } from './storages/storages.module';
import { AnalyticsModule } from './analytics/analytics.module';
// [FIXED] Pastikan path ini benar menunjuk ke file auth.module.ts Anda.
// Path ini mengasumsikan struktur folder: src/auth/auth.module.ts
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Load environment variables globally with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        SUPABASE_URL: Joi.string().uri().required(),
        SUPABASE_ANON_KEY: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('1d'),
      }),
    }),

    // Feature Modules
    SupabaseModule,
    CustomersModule,
    ProfilesModule,
    ReadingsModule,
    StoragesModule,
    AnalyticsModule,
    AuthModule,
  ],
})
export class AppModule { }
