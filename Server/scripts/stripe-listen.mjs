import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
if (!/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || ''))
  throw new Error('Set a Stripe test secret key in Server/.env.');
const listener = spawn(
  process.execPath,
  [
    'node_modules/@stripe/cli/bin/shim.js',
    'listen',
    '--events',
    'checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed',
    '--forward-to',
    'http://127.0.0.1:4000/payments/webhook',
  ],
  {
    env: {
      ...process.env,
      STRIPE_API_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_NO_AUTO_UPDATE: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  },
);
let received = false;
let buffer = '';
function output(chunk) {
  const value = chunk.toString();
  buffer = (buffer + value).slice(-10000);
  const signingSecret = buffer.match(/whsec_[a-zA-Z0-9]+/)?.[0];
  if (signingSecret && !received) {
    received = true;
    const source = readFileSync('.env', 'utf8');
    writeFileSync(
      '.env',
      /^STRIPE_WEBHOOK_SECRET=.*$/m.test(source)
        ? source.replace(
            /^STRIPE_WEBHOOK_SECRET=.*$/m,
            `STRIPE_WEBHOOK_SECRET=${signingSecret}`,
          )
        : `${source.trimEnd()}\nSTRIPE_WEBHOOK_SECRET=${signingSecret}\n`,
    );
    console.log(
      'Stripe webhook forwarding ready. Signing secret saved to the ignored Server/.env file.',
    );
  }
  for (const type of value.match(/checkout\.session\.[a-z_]+/g) || [])
    console.log(`Stripe event: ${type}`);
  const status = value.match(/\[(\d{3})\] POST/);
  if (status) console.log(`Local webhook response: ${status[1]}`);
}
listener.stdout.on('data', output);
listener.stderr.on('data', output);
listener.on('error', () => {
  console.error('Stripe CLI could not start.');
  process.exitCode = 1;
});
listener.on('exit', (code) => process.exit(code || 0));
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    listener.kill();
    process.exit(0);
  });
