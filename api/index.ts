import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

// Kita akan cache instance aplikasi agar tidak perlu dibuat ulang di setiap request (cold start)
let cachedApp: INestApplication;

// Fungsi bootstrap yang sudah dimodifikasi (tanpa listen())
async function bootstrap(): Promise<INestApplication> {
    if (cachedApp) {
        return cachedApp;
    }

    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    // Semua konfigurasi dari main.ts Anda pindah ke sini
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
            'ngrok-skip-browser-warning',
        ],
    });
    app.useGlobalPipes(new ValidationPipe());

    const config = new DocumentBuilder()
        .setTitle('CNG PTC API (Vercel)')
        .setDescription('Dokumentasi lengkap untuk backend aplikasi CNG PTC.')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Masukkan token JWT',
                in: 'header',
            },
            'JWT-auth',
        )
        .addServer('/') // Penting untuk Vercel, agar base path benar
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    // Inisialisasi aplikasi
    await app.init();
    cachedApp = app;
    return app;
}

// Handler utama yang akan diekspor untuk Vercel
export default async function handler(req: any, res: any) {
    const app = await bootstrap();
    const expressApp = app.getHttpAdapter().getInstance();

    // Teruskan request ke instance Express dari NestJS
    expressApp(req, res);
}
