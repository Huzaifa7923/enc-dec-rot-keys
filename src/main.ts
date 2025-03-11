import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import  * as express from 'express'
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //jisse validation fail hone pr  error throw / validation decorators will get triggered
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // transform payloads to DTO instances
    whitelist: true, // remove unwanted fields
  }));
  
  await app.listen(3001);

}
bootstrap();

// interceptor
// validationFilter
