import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const databaseDir = resolve('.data/postgres');
const pg = new EmbeddedPostgres({
  databaseDir, user: 'postgres', password: 'postgres', port: 5432,
  persistent: true, postgresFlags: ['-h', '127.0.0.1'],
  onLog: () => {}, onError: (message) => console.error(String(message).trim()),
});
if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
const result = await client.query("SELECT 1 FROM pg_database WHERE datname = 'fashion_brand_showcase'");
await client.end();
if (!result.rowCount) await pg.createDatabase('fashion_brand_showcase');
console.log('Local PostgreSQL ready on 127.0.0.1:5432. Ctrl+C to stop.');
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await pg.stop();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 60_000);
