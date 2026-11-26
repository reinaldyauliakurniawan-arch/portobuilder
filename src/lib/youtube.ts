/** Pola yang sama dipakai validasi CMS (config.yml) dan Zod. */
export const YOUTUBE_PATTERN = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/.+/;
export const YOUTUBE_PATTERN_SOURCE = '^(https?://)?(www\\.|m\\.)?(youtube\\.com|youtu\\.be|youtube-nocookie\\.com)/.+';

export interface YouTubeInfo {
  id: string;
  start: number;
  isShort: boolean;
}

/** "1h2m3s", "90s", "90" -> detik */
function parseTime(t: string | null): number {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

/** Ekstrak ID + waktu mulai dari link watch, youtu.be, shorts, embed, live. Melempar error bila bukan link YouTube valid. */
export function parseYouTube(input: string): YouTubeInfo {
  const raw = input.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error(`Link YouTube tidak valid: "${input}"`);
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, '');
  const parts = url.pathname.split('/').filter(Boolean);
  let id: string | undefined;
  let isShort = false;

  if (host === 'youtu.be') id = parts[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parts[0] === 'watch') id = url.searchParams.get('v') ?? undefined;
    else if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
      id = parts[1];
      isShort = parts[0] === 'shorts';
    }
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error(`Link YouTube tidak valid: "${input}". ID video tidak ditemukan.`);

  const start = parseTime(url.searchParams.get('t') ?? url.searchParams.get('start'));
  return { id, start, isShort };
}

export const watchUrl = ({ id, start }: YouTubeInfo) => `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ''}`;
