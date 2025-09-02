import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

let cachedApp: INestApplication;

async function bootstrap(): Promise<INestApplication> {
    if (cachedApp) {
        return cachedApp;
    }

    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    // KEMBALIKAN GLOBAL PREFIX, ini penting untuk routing yang konsisten
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
        .build();

    const document = SwaggerModule.createDocument(app, config);

    // Menambahkan opsi kustom untuk memastikan aset UI dimuat dengan benar
    const swaggerCustomOptions = {
        customSiteTitle: 'CNG PTC API Docs',
    };

    // Path Swagger akan otomatis menjadi /api/api-docs karena global prefix
    SwaggerModule.setup('api-docs', app, document, swaggerCustomOptions);

    await app.init();
    cachedApp = app;
    return app;
}

export default async function handler(req: any, res: any) {
    const app = await bootstrap();
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp(req, res);
}

