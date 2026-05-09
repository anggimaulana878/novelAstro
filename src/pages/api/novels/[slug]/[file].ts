import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { brotliDecompressSync } from 'node:zlib';

export const GET: APIRoute = async ({ params }) => {
  const { slug, file } = params;
  
  if (!slug || !file) {
    return new Response('Missing parameters', { status: 400 });
  }
  
  // Security: prevent path traversal
  if (slug.includes('..') || file.includes('..')) {
    return new Response('Invalid path', { status: 400 });
  }
  
  // Only allow .json files
  if (!file.endsWith('.json')) {
    return new Response('Invalid file type', { status: 400 });
  }
  
  try {
    let data: string;
    const basePath = path.join(process.cwd(), 'public', 'novels', slug);
    
    const decompressedPath = path.join(basePath, file);
    if (fs.existsSync(decompressedPath)) {
      data = fs.readFileSync(decompressedPath, 'utf-8');
    } else {
      const brPath = path.join(basePath, `${file}.br`);
      if (!fs.existsSync(brPath)) {
        console.error(`Bundle not found: ${brPath}`);
        return new Response('Bundle not found', { status: 404 });
      }
      const compressed = fs.readFileSync(brPath);
      const decompressed = brotliDecompressSync(compressed);
      data = decompressed.toString('utf-8');
    }
    
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving bundle:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
