import 'dotenv/config';
import { createApp } from './app.module';
import { envConfig } from './config/env.config';

const { port } = envConfig();

const app = createApp();
app.listen(port, () => {
  console.log(`Task service listening on http://localhost:${port}`);
});
