import type { Preview } from './content';

/**
 * Atribut penanda untuk editor visual: hanya dirender di preview (/edit/render),
 * jadi HTML situs publik tetap bersih. `path` relatif terhadap section, atau "page.xxx" untuk field halaman.
 */
export const ed = (locals: { preview?: Preview } | undefined, path: string | undefined) =>
  locals?.preview?.canvas && path ? { 'data-edit': path } : {};
