// Warna tema final untuk satu request (termasuk aksen `auto` dari foto hero). Server-only.
import { accentSource, getTheme, type Preview } from './content';
import { imageAccent } from './image';
import { resolveTheme } from './themes';

export async function getColors(l?: { preview?: Preview }) {
  const theme = await getTheme(l);
  const img = theme.accentColor === 'auto' ? await accentSource(l) : undefined;
  return { theme, colors: resolveTheme(theme, img ? await imageAccent(img, l) : null) };
}
