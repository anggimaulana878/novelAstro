export interface NovelProgress {
  lastChapter: number;
  lastReadAt: string;
  bundleMode: boolean;
  bundleType: 'chapters' | 'wordcount';
  bundleSize: number;
}

export interface ReaderSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 1 | 2 | 3 | 4 | 5;
  fontFamily: 'serif' | 'sans' | 'mono';
}

type AllProgress = Record<string, NovelProgress>;

const PROGRESS_KEY = 'novel-progress';
const SETTINGS_KEY = 'reader-settings';

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'system',
  fontSize: 3,
  fontFamily: 'sans',
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

export function getProgress(slug: string): NovelProgress | null {
  const all = read<AllProgress>(PROGRESS_KEY);
  return all?.[slug] ?? null;
}

export function setProgress(slug: string, data: Partial<NovelProgress>): void {
  const all = read<AllProgress>(PROGRESS_KEY) ?? {};
  const existing = all[slug] ?? {
    lastChapter: 1,
    lastReadAt: new Date().toISOString(),
    bundleMode: false,
    bundleType: 'chapters' as const,
    bundleSize: 20,
  };
  all[slug] = { ...existing, ...data, lastReadAt: new Date().toISOString() };
  write(PROGRESS_KEY, all);
}

export function getAllProgress(): AllProgress {
  return read<AllProgress>(PROGRESS_KEY) ?? {};
}

export function getSettings(): ReaderSettings {
  return read<ReaderSettings>(SETTINGS_KEY) ?? DEFAULT_SETTINGS;
}

export function setSettings(settings: Partial<ReaderSettings>): void {
  const current = getSettings();
  write(SETTINGS_KEY, { ...current, ...settings });
}
