import { getSettings, setSettings } from './storage';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode;
}

function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', resolved);
}

export function initTheme(): void {
  const { theme } = getSettings();
  applyTheme(resolveTheme(theme));

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = getSettings().theme;
    if (current === 'system') {
      applyTheme(getSystemTheme());
    }
  });
}

export function getTheme(): ThemeMode {
  return getSettings().theme;
}

export function setTheme(mode: ThemeMode): void {
  setSettings({ theme: mode });
  applyTheme(resolveTheme(mode));
}
