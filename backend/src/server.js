import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

const boot = async () => {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Studify backend listening on http://localhost:${env.port}`);
  });
};

boot().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

