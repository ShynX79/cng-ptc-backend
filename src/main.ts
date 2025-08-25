import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // [FIXED] Konfigurasi CORS yang lebih eksplisit untuk menangani Preflight Request
  app.enableCors({
    origin: '*', // Mengizinkan semua domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization', // <-- PENTING: Izinkan header Authorization
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
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Aplikasi berjalan di: ${await app.getUrl()}`);
  console.log(`Dokumentasi Swagger tersedia di: ${await app.getUrl()}/api-docs`);
}
bootstrap();
