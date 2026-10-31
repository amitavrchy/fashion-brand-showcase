import { createApplication } from './bootstrap.js';

async function bootstrap() {
  const app = await createApplication();
  await app.listen(process.env.PORT ?? 4000, process.env.HOST ?? '127.0.0.1');
}
await bootstrap();
