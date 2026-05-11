import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  type MiddlewareFactory = () => Parameters<typeof app.use>[0];

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://krezona.rajeshpandey10.com.np',
      'https://krezona-task-frontend.vercel.app/',
      'https://krezona-task-backend.onrender.com/',
      'http://localhost:3000',
    ],
    credentials: true,
  });

  const cookieParserMiddleware = cookieParser as unknown as MiddlewareFactory;
  app.use(cookieParserMiddleware());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger / OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('Krezona API')
    .setDescription('Krezona backend API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log('server is running on http://localhost:3000');
}
void bootstrap();
