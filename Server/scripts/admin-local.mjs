import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const database = new URL(process.env.DATABASE_URL || '');
if (
  process.env.NODE_ENV === 'production' ||
  !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname) ||
  database.pathname.endsWith('_test')
)
  throw new Error(
    'This helper provisions only a local development administrator.',
  );
const db = new PrismaClient();
try {
  if (await db.user.count({ where: { role: 'ADMIN' } })) {
    console.log(
      'An administrator already exists. Its credentials have not been changed.',
    );
  } else {
    let email = 'admin@atelierlune.example';
    if (await db.user.findUnique({ where: { email } }))
      email = `admin-${randomBytes(3).toString('hex')}@atelierlune.example`;
    const password = randomBytes(20).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 12);
    const directory = resolve('.data');
    await mkdir(directory, { recursive: true });
    const credentials = resolve(directory, 'admin-access.txt');
    await writeFile(
      credentials,
      `ATELIER LUNE — local administrator\n\nAdmin panel: http://localhost:3001/admin\nSign in: http://localhost:3001/account\nEmail: ${email}\nPassword: ${password}\n\nKeep this local file private. It is excluded from Git.\n`,
      { mode: 0o600, flag: 'wx' },
    );
    await db.user.create({
      data: { email, name: 'Atelier owner', role: 'ADMIN', passwordHash },
    });
    console.log(
      'Local administrator created. Open Server/.data/admin-access.txt for sign-in details.',
    );
  }
} finally {
  await db.$disconnect();
}
