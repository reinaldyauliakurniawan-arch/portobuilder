// Pilih kamus UI sesuai Pengaturan Situs → Bahasa Situs. Kamus ada di i18n-strings.ts (murni, bisa dites).
import { getSite, type Preview } from './content';
import { STRINGS, type Lang, type Strings } from './i18n-strings';

export { STRINGS, type Lang, type Strings };

/** Teks UI untuk bahasa situs. */
export async function getStrings(l?: { preview?: Preview }): Promise<Strings & { lang: Lang }> {
  const site = await getSite(l);
  const lang = (site.language ?? 'id') as Lang;
  return { ...STRINGS[lang], lang };
}
