export const USER_PREFERENCES_STORAGE_KEY = 'userPreferences';

export type UserTheme = 'light' | 'dark' | 'auto';

export type UserPreferences = {
  language: string;
  theme: UserTheme;
  timezone: string;
  dateFormat: string;
  timeFormat: '24h' | '12h';
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: 'fr',
  theme: 'light',
  timezone: 'Europe/Paris',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
};

const VALID_THEMES = new Set<UserTheme>(['light', 'dark', 'auto']);
const VALID_TIMEZONES = new Set([
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseStoredPreferences(raw: string | null): UserPreferences | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    const theme = parsed.theme;
    const timezone = parsed.timezone;

    return {
      language: typeof parsed.language === 'string' ? parsed.language : DEFAULT_USER_PREFERENCES.language,
      theme: VALID_THEMES.has(theme as UserTheme)
        ? (theme as UserTheme)
        : DEFAULT_USER_PREFERENCES.theme,
      timezone:
        typeof timezone === 'string' && VALID_TIMEZONES.has(timezone)
          ? timezone
          : DEFAULT_USER_PREFERENCES.timezone,
      dateFormat:
        typeof parsed.dateFormat === 'string'
          ? parsed.dateFormat
          : DEFAULT_USER_PREFERENCES.dateFormat,
      timeFormat:
        parsed.timeFormat === '12h' || parsed.timeFormat === '24h'
          ? parsed.timeFormat
          : DEFAULT_USER_PREFERENCES.timeFormat,
    };
  } catch {
    return null;
  }
}

/** Charge les préférences depuis localStorage (navigateur uniquement). */
export function loadUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_USER_PREFERENCES };
  }
  try {
    const stored = window.localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
    return parseStoredPreferences(stored) ?? { ...DEFAULT_USER_PREFERENCES };
  } catch {
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

/** Enregistre les préférences et applique le thème. */
export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    applyTheme(preferences.theme);
    applyTimezone(preferences.timezone);
  } catch {
    /* localStorage indisponible */
  }
}

export function getUserTimezone(): string {
  return loadUserPreferences().timezone;
}

function resolveDarkMode(theme: UserTheme): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Applique la classe `dark` sur <html> (Tailwind darkMode: class). */
export function applyTheme(theme: UserTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolveDarkMode(theme)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function applyTimezone(timezone: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.timezone = timezone;
}

/** Script inline à exécuter avant le paint pour éviter un flash de thème. */
export const USER_PREFERENCES_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(USER_PREFERENCES_STORAGE_KEY)};var p=JSON.parse(localStorage.getItem(k)||'null');if(!p)return;var t=p.theme;if(t==='dark'||(t==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');if(p.timezone)document.documentElement.dataset.timezone=p.timezone}catch(e){}})();`;
