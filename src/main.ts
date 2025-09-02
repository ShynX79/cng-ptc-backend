import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Konfigurasi tetap dibutuhkan untuk local development
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('CNG PTC API (Local)')
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

  // Hanya listen() saat dijalankan secara lokal
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Aplikasi lokal berjalan di: http://localhost:${port}`);
  console.log(`Swagger lokal tersedia di: http://localhost:${port}/api-docs`);
}

// Hanya panggil bootstrap jika file ini dijalankan langsung
if (require.main === module) {
  bootstrap();
}
