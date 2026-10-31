import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const npmCli = process.env.npm_execpath;
if (!npmCli)
  throw new Error('Run this script with npm --prefix Server run setup.');
for (const [directory, target] of [
  ['Server', '.env'],
  ['Client', '.env.local'],
]) {
  const destination = resolve(root, directory, target);
  if (!existsSync(destination)) {
    const template = readFileSync(
      resolve(root, directory, '.env.example'),
      'utf8',
    );
    writeFileSync(
      destination,
      template.replace(
        'JWT_SECRET=replace-with-at-least-32-random-characters',
        `JWT_SECRET=${randomBytes(48).toString('hex')}`,
      ),
    );
    console.log(`Created ${directory}/${target}.`);
  } else console.log(`Keeping existing ${directory}/${target}.`);
  const result = spawnSync(process.execPath, [npmCli, 'ci'], {
    cwd: resolve(root, directory),
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(
  'Setup ready. Run npm --prefix Server run db:local; then npm --prefix Server run db:prepare and npm --prefix Server run dev:all from the repository root.',
);
