import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

async function bootstrap(expressInstance) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('Swagger API docs')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.init();
}

bootstrap(server);

export default server;
