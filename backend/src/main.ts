import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { getUploadDir } from './config/storage.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind a reverse proxy (Railway/Render/etc.) the real client IP arrives via
  // X-Forwarded-For — without this, rate limiting buckets everyone under the proxy IP
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS configuration — dev origins only outside production
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const isProduction = process.env.NODE_ENV === 'production';
  const origins = isProduction
    ? [frontendUrl]
    : [frontendUrl, 'http://localhost:5173', 'http://localhost:3000'];
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Serve locally stored uploads (only when Cloudinary is not configured)
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    app.useStaticAssets(getUploadDir(), {
      prefix: '/uploads/',
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
