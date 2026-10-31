import { readdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const images = new URL('../public/images/', import.meta.url);
const dimensions = {};
for (const name of await readdir(images)) {
  if (!/\.(webp|jpg|jpeg|png)$/.test(name)) continue;
  const { width, height } = await sharp(fileURLToPath(new URL(name, images))).metadata();
  dimensions[`/images/${name}`] = [width, height];
}
await writeFile(
  new URL('../src/lib/image-dimensions.json', import.meta.url),
  JSON.stringify(dimensions, null, 2) + '\n',
);
console.log(`Recorded dimensions for ${Object.keys(dimensions).length} photographs.`);
