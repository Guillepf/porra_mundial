export function flagUrl(code: string | undefined | null, height = 32): string {
  if (!code) return '';
  const c = String(code).toLowerCase();
  // Uses FlagCDN by code (e.g. 'us', 'gb-sct', 'mx')
  return `https://flagcdn.com/h${height}/${c}.png`;
}

export async function flagExists(code: string | undefined | null, height = 32): Promise<boolean> {
  const url = flagUrl(code, height);
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export function flagEmojiFromCode(code: string | undefined | null): string {
  if (!code) return '🏳️';
  // Try to use the first two-letter part (handles codes like 'gb-sct')
  const primary = (code as any).split('-')[0].toUpperCase();
  if (primary.length !== 2) return '🏳️';
  const base = 127397;
  return String.fromCodePoint(...[...primary].map((c) => c.charCodeAt(0) + base));
}
