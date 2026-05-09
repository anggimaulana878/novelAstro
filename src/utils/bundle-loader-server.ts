// src/utils/bundle-loader-server.ts
import fs from 'node:fs';
import path from 'node:path';

/**
 * Raw chapter data from bundle JSON
 */
interface RawChapter {
  id: number;
  title: string;
  body: string;
  url?: string;
  volume?: number;
  volumeTitle?: string;
}

/**
 * Raw bundle file structure
 */
interface RawBundle {
  bundleId: number;
  range: string;
  novelSlug: string;
  chapters: RawChapter[];
}

/**
 * Bundle metadata from info.json
 */
interface BundleInfo {
  id: number;
  range: string;
  file: string;
  chapters: number;
  sizeKB: number;
}

/**
 * Novel metadata from info.json
 */
interface NovelInfo {
  id: string;
  title: string;
  totalChapters: number;
  bundleSize: number;
  bundles: BundleInfo[];
}

/**
 * Processed chapter for rendering
 */
export interface Chapter {
  number: number;
  title: string;
  content: string;
  lang: string;
}
