import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. AKTIFKAN KEMBALI GLOBAL PREFIX
  app.setGlobalPrefix('api');

  // 2. UBAH KONFIGURASI CORS
  app.enableCors({
    origin: '*', // Izinkan semua domain untuk development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'ngrok-skip-browser-warning',
    ],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

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
  SwaggerModule.setup('api-docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  const appUrl = await app.getUrl();
  Logger.log(`🚀 Aplikasi berjalan di: ${appUrl}`, 'Bootstrap');
  Logger.log(
    `📚 Dokumentasi Swagger tersedia di: ${appUrl}/api-docs`,
    'Bootstrap',
  );
}
bootstrap();