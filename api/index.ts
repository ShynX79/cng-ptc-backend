// File: api/index.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module'; // Pastikan path ini benar
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
// Impor 'express' sebagai default dan juga tipe 'Request' & 'Response'
import express, { Request, Response } from 'express';

// Cache instance server agar tidak dibuat ulang setiap request (optimasi)
// TIPE DIPERBAIKI: Menggunakan 'express.Express' karena itu yang dikembalikan oleh bootstrap
let cachedServer: express.Express;

async function bootstrap(): Promise<express.Express> {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter);

    // Menetapkan prefix global untuk semua route
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
        .setTitle('CNG PTC API')
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
        .build();

    const document = SwaggerModule.createDocument(app, config);

    // PATH DIPERBAIKI: Cukup 'api-docs'. Prefix 'api' akan ditambahkan otomatis.
    // URL final akan menjadi /api/api-docs
    SwaggerModule.setup('api-docs', app, document);

    // Inisialisasi aplikasi NestJS tanpa memulai server
    await app.init();

    return expressApp;
}

// Handler utama yang akan diekspor untuk Vercel
// TIPE DIPERBAIKI: Menambahkan tipe 'Request' dan 'Response' untuk 'req' dan 'res'
export default async (req: Request, res: Response) => {
    if (!cachedServer) {
        // Panggil bootstrap untuk membuat instance aplikasi Express
        const expressApp = await bootstrap();
        cachedServer = expressApp;
    }

    // Teruskan request ke instance aplikasi yang sudah di-cache
    return cachedServer(req, res);
};