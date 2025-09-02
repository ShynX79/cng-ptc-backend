import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // === CORS ===
  app.enableCors({
    origin: [
      'http://localhost:3000',                       // FE lokal
      'https://cng-ptc-frontend.vercel.app',         // FE deploy (ganti sesuai domain FE kamu di Vercel)
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // === Swagger Config ===
  const config = new DocumentBuilder()
    .setTitle('CNG-PTC API')
    .setDescription('Swagger documentation for CNG-PTC Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI akan tersedia di https://.../docs
  SwaggerModule.setup('docs', app, document);

  // === Start Server ===
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📖 Swagger docs on http://localhost:${port}/docs`);
}

bootstrap();
