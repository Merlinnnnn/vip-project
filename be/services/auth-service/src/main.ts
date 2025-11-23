import { createApp } from './app.module';

async function bootstrap() {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Auth service (Express) is running on http://localhost:${port}`);
  });
}

bootstrap();
