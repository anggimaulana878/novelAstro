// scripts/copy-compressed-to-vercel.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const publicDir = path.join(projectRoot, 'public');
const vercelStaticDir = path.join(projectRoot, '.vercel', 'output', 'static');

// Create .vercel/output/static if it doesn't exist
if (!fs.existsSync(vercelStaticDir)) {
  fs.mkdirSync(vercelStaticDir, { recursive: true });
}

/**
 * Copy files recursively, but skip decompressed volume .json files in novels/
 * Keep info.json and index.json, only skip vol-*.json files
 */
function copyRecursive(src, dest, isNovelsDir = false) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      const isNovels = entry.name === 'novels' || isNovelsDir;
      copyRecursive(srcPath, destPath, isNovels);
    } else {
      // Skip decompressed volume JSON files (vol-*.json) in novels directory
      // Keep info.json, index.json, and all .br files
      if (isNovelsDir && entry.name.match(/^vol-\d+\.json$/) && !entry.name.endsWith('.br')) {
        console.log(`  Skipping: ${path.relative(publicDir, srcPath)}`);
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('📦 Copying compressed bundles to .vercel/output/static/...');
console.log('   (Skipping decompressed .json files to stay under 250MB limit)');
copyRecursive(publicDir, vercelStaticDir);
console.log('✅ Compressed assets copied successfully');

// Report size
const { execSync } = await import('node:child_process');
try {
  const size = execSync(`du -sh ${vercelStaticDir}`, { encoding: 'utf-8' }).trim().split('\t')[0];
  console.log(`📊 Total static output size: ${size}`);
} catch (e) {
  // du command might not be available on all systems
}
