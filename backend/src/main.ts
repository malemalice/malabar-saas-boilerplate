import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Configure raw body parser specifically for Stripe webhooks
  app.use('/billing/webhook/stripe', raw({ type: 'application/json' }), (req, res, next) => {
    if (req.method === 'POST') {
      req['rawBody'] = req.body;
    }
    next();
  });

  // Enable JSON parsing for all other routes
  app.use(json());

  const config = new DocumentBuilder()
    .setTitle('Quiz API')
    .setDescription('The Quiz application API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(3000);
}
bootstrap();