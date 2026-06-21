import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();
app.listen(env.port, () => {
  console.log(`🟢 GANNDAL API sur http://localhost:${env.port}/api (${env.nodeEnv})`);
});
