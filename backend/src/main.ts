import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  const jwtSecret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!jwtSecret || jwtSecret.length < 32 || jwtSecret.startsWith('CHANGE_THIS'))) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters in production');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind a reverse proxy (Railway, nginx, etc.) req.ip would be the proxy's IP,
  // making every user share one rate-limit bucket. Only enable when a proxy
  // sets X-Forwarded-For, otherwise clients could spoof it.
  if (process.env.TRUST_PROXY) {
    const hops = Number(process.env.TRUST_PROXY);
    app.set('trust proxy', Number.isNaN(hops) ? process.env.TRUST_PROXY : hops);
  }

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS configuration
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
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

  // Serve locally stored uploads (only if not using Cloudinary)
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    app.useStaticAssets(resolve(process.env.UPLOAD_DIR || './uploads'), {
      prefix: '/uploads/',
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
