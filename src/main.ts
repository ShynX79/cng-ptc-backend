import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('CNG Backend API')
    .setDescription('Swagger API documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI di /api
  SwaggerModule.setup('api', app, document);

  // Swagger JSON manual di /api-json
  app.getHttpAdapter().getInstance().get('/api-json', (req, res) => {
    res.json(document);
  });

  await app.listen(3000);
}
bootstrap();
