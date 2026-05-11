import { serve } from '@hono/node-server';
import { loadConfig } from './config';
import { createRelayApp } from './http/app';
import { SqliteRelayStore } from './store/sqlite/sqlite-relay-store';

const config = loadConfig();
const store = new SqliteRelayStore(config.databasePath);
const app = createRelayApp({ store, config });

const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`SpiceSync relay listening on http://localhost:${info.port}`);
  },
);

function shutdown(signal: string): void {
  console.log(`Received ${signal}; shutting down relay`);
  server.close(() => {
    store.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
