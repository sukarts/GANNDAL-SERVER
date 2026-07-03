import { createApp } from './app.js';
import { env } from './config/env.js';
import { startScheduler } from './lib/scheduler.js';

const app = createApp();
app.listen(env.port, () => {
  console.log(`🟢 GANNDAL API sur http://localhost:${env.port}/api (${env.nodeEnv})`);
  if (env.nodeEnv !== 'test') startScheduler();
});
