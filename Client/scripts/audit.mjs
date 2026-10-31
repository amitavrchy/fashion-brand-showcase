import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = resolve(dirname(fileURLToPath(import.meta.url)), '../.data/quality');
await mkdir(output, { recursive: true });
const url = process.env.AUDIT_URL || 'http://localhost:3000';
const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: ['html', 'json'],
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  });
  await writeFile(resolve(output, 'lighthouse.html'), result.report[0]);
  await writeFile(resolve(output, 'lighthouse.json'), result.report[1]);
  console.log(
    JSON.stringify(
      {
        scores: Object.fromEntries(
          Object.entries(result.lhr.categories).map(([key, value]) => [
            key,
            Math.round(value.score * 100),
          ]),
        ),
        metrics: Object.fromEntries(
          [
            'first-contentful-paint',
            'largest-contentful-paint',
            'total-blocking-time',
            'cumulative-layout-shift',
          ].map((key) => [key, result.lhr.audits[key].displayValue]),
        ),
        opportunities: Object.entries(result.lhr.audits)
          .filter(([, value]) => value.score !== null && value.score < 0.9)
          .map(([key, value]) => ({
            id: key,
            title: value.title,
            displayValue: value.displayValue,
          })),
        report: resolve(output, 'lighthouse.html'),
      },
      null,
      2,
    ),
  );
} finally {
  await chrome.kill();
}
