import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as swaggerUi from 'swagger-ui-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('CNG Backend API')
    .setDescription('Swagger API documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Gunakan swagger-ui-express
  app.use('/api', swaggerUi.serve, swaggerUi.setup(document));

  await app.listen(3000);
}
bootstrap();
