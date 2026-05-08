import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';

const NOVELS_DIR = join(process.cwd(), 'public/novels');

async function decompressAll() {
  const entries = await readdir(NOVELS_DIR);

  for (const entry of entries) {
    const novelDir = join(NOVELS_DIR, entry);
    const s = await stat(novelDir);
    if (!s.isDirectory()) continue;

    const files = await readdir(novelDir);
    for (const file of files) {
      if (!file.endsWith('.json.br')) continue;

      const jsonFile = file.replace(/\.br$/, '');
      const jsonPath = join(novelDir, jsonFile);

      try {
        await stat(jsonPath);
        continue;
      } catch {
        // .json doesn't exist yet, decompress
      }

      const compressed = await readFile(join(novelDir, file));
      const decompressed = brotliDecompressSync(compressed);
      await writeFile(jsonPath, decompressed);
      console.log(`  ${entry}/${jsonFile}`);
    }
  }
}

console.log('Decompressing novel bundles...');
await decompressAll();
console.log('Done.');
