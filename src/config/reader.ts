// src/config/reader.ts

/**
 * Reader configuration for batch modes
 */
export const READER_CONFIG = {
  /** Chapter count presets for bulk-by-chapter mode */
  chapterPresets: [3, 5, 8, 10, 12] as const,
  
  /** Word count presets for bulk-by-word mode (in words) */
  wordCountPresets: [8000, 15000, 25000] as const,
  
  /** Maximum word count allowed */
  maxWordCount: 25000,
  
  /** Default batch size for new users */
  defaultChapterCount: 10,
  defaultWordCount: 15000,
} as const;

export type ChapterPreset = typeof READER_CONFIG.chapterPresets[number];
export type WordCountPreset = typeof READER_CONFIG.wordCountPresets[number];
