import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core Modules
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';

// Feature Modules
import { CustomersModule } from './customers/customers.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ReadingsModule } from './readings/readings.module';
import { StoragesModule } from './storages/storages.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ExportModule } from './export/export.module';

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
    ExportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

