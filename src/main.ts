import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Menambahkan prefix 'api' ke semua endpoint (e.g., /api/customers)
  app.setGlobalPrefix('api');

  // Mengaktifkan CORS untuk mengizinkan permintaan dari domain lain
  app.enableCors();

  // Mengaktifkan validasi global untuk semua DTO
  app.useGlobalPipes(new ValidationPipe());

  // Konfigurasi Swagger
  const config = new DocumentBuilder()
    .setTitle('CNG PTC API')
    .setDescription('Dokumentasi lengkap untuk backend aplikasi CNG PTC.')
    .setVersion('1.0')
    // Menambahkan autentikasi Bearer Token ke Swagger UI
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Masukkan token JWT',
        in: 'header',
      },
      'JWT-auth', // Nama skema keamanan ini harus unik
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Mengubah path Swagger UI menjadi /api-docs
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Aplikasi berjalan di: ${await app.getUrl()}`);
  console.log(`Dokumentasi Swagger tersedia di: ${await app.getUrl()}/api-docs`);
}
bootstrap();
