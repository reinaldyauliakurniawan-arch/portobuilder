// Fontsource self-host: semua preset memakai Montserrat (permintaan pemilik situs).
// Satu file variabel subset latin (bobot 100–900), jadi halaman hanya memuat 1 file font.
// Karakter tiap preset dibedakan lewat bobot, tracking, dan kapitalisasi heading di styles/themes.css.
import montserrat from '@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2?url';
import { PRESET_IDS, type PresetId } from './themes';

interface Face {
  family: string;
  url: string;
  weight: string;
}

const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const MONTSERRAT: Face = { family: 'Montserrat Variable', url: montserrat, weight: '100 900' };

export const PRESET_FONTS = Object.fromEntries(PRESET_IDS.map((id) => [id, { heading: MONTSERRAT, body: MONTSERRAT }])) as Record<
  PresetId,
  { heading: Face; body: Face }
>;

const STACK = `'${MONTSERRAT.family}', system-ui, sans-serif`;

/** CSS @font-face + variabel font. `presets` dipertahankan untuk kompatibilitas pemanggil. */
export function fontCss(_presets: PresetId[] = []): string {
  return (
    `@font-face{font-family:'${MONTSERRAT.family}';font-style:normal;font-display:swap;font-weight:${MONTSERRAT.weight};src:url(${MONTSERRAT.url}) format('woff2');unicode-range:${LATIN}}` +
    `:root{--font-heading:${STACK};--font-body:${STACK}}`
  );
}
