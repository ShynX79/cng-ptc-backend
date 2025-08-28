// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

// Core Modules
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';

// Feature Modules
import { CustomersModule } from './customers/customers.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ReadingsModule } from './readings/readings.module';
import { StoragesModule } from './storages/storages.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ExportModule } from './export/export.module'; // <-- Tambahkan ini

@Module({
  imports: [
    // 1. Konfigurasi
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_ANON_KEY: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        SUPABASE_JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('1d'),
      }),
    }),

    // 2. Modul inti
    SupabaseModule,
    AuthModule,

    // 3. Modul Fitur
    CustomersModule,
    ProfilesModule,
    ReadingsModule,
    StoragesModule,
    AnalyticsModule,
    ExportModule, // <-- Tambahkan ini
  ],
})
export class AppModule { }