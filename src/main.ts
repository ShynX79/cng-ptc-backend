import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', // FE local
      'https://your-frontend.vercel.app', // FE deploy
    ],
    credentials: true,
  });

  // ✅ Swagger
  const config = new DocumentBuilder()
    .setTitle('API Docs')
    .setDescription('Swagger API for CNG-PTC')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // swagger di /api

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
