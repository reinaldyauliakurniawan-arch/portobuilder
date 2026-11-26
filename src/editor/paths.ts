// Akses nilai bersarang dengan path "a.0.b", plus pencarian definisi field (label, batas) dari cms-fields.
import { collections, sectionTypes } from '../lib/cms-fields.mjs';

export type Field = {
  name: string;
  label: string;
  widget: string;
  hint?: string;
  required?: boolean;
  maxlength?: number;
  pattern?: [string, string];
  options?: { label: string; value: string }[];
  default?: unknown;
  fields?: Field[];
  field?: Field;
  types?: unknown[];
  min?: number;
  max?: number;
  summary?: string;
  accept?: string;
  type?: string;
  value_type?: string;
};

export const keys = (path: string) => path.split('.').filter(Boolean);

export function getAt(obj: unknown, path: string): any {
  return keys(path).reduce<any>((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setAt(obj: any, path: string, value: unknown) {
  const ks = keys(path);
  let o = obj;
  ks.slice(0, -1).forEach((k, i) => {
    if (o[k] == null) o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    o = o[k];
  });
  o[ks[ks.length - 1]] = value;
}

export const SECTION_TYPES = sectionTypes as unknown as { name: string; label: string; summary?: string; fields: Field[] }[];

const coll = (name: string) => (collections as any[]).find((c) => c.name === name);
export const fileFields = (col: string, file: string): Field[] => coll(col).files.find((f: any) => f.name === file).fields;
export const folderFields = (col: string): Field[] => coll(col).fields;

/** Definisi field untuk path relatif terhadap daftar field (indeks list dilewati). */
export function fieldAt(fields: Field[], path: string): Field | undefined {
  let list: Field[] | undefined = fields;
  let found: Field | undefined;
  for (const k of keys(path)) {
    if (/^\d+$/.test(k)) continue;
    found = list?.find((f) => f.name === k);
    if (!found) return undefined;
    list = found.fields ?? (found.field ? [found.field] : undefined);
  }
  return found;
}

export const sectionDef = (type: string) => SECTION_TYPES.find((t) => t.name === type);

/** Label manusiawi untuk path, mis. "Hero › Judul besar". */
export function labelFor(fields: Field[], path: string): string {
  const out: string[] = [];
  let list: Field[] | undefined = fields;
  for (const k of keys(path)) {
    if (/^\d+$/.test(k)) {
      out.push(`#${Number(k) + 1}`);
      continue;
    }
    const f: Field | undefined = list?.find((x) => x.name === k);
    if (!f) {
      out.push(k);
      list = undefined;
      continue;
    }
    out.push(f.label);
    list = f.fields ?? (f.field ? [f.field] : undefined);
  }
  return out.join(' › ');
}

/** Nilai awal item baru: field wajib diisi teks label (supaya langsung tampil & lolos validasi). */
export function defaults(fields: Field[]): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.widget === 'hidden') continue;
    switch (f.widget) {
      case 'string':
      case 'text':
      case 'markdown':
        o[f.name] = f.default ?? (f.required === false || f.pattern || f.type ? '' : f.label);
        break;
      case 'boolean':
        o[f.name] = f.default ?? false;
        break;
      case 'select':
        o[f.name] = f.default ?? (f.required === false ? '' : f.options?.[0]?.value);
        break;
      case 'number':
        o[f.name] = f.default ?? f.min ?? 0;
        break;
      case 'image':
        o[f.name] = f.required === false ? '' : '/uploads/sample/gallery-1.webp';
        break;
      case 'list':
        o[f.name] = [];
        break;
      case 'object':
        o[f.name] = defaults(f.fields ?? []);
        break;
      default:
        o[f.name] = '';
    }
  }
  return o;
}

// Syarat varian dibaca dari hint cms-fields ("Hanya dipakai varian X & Y.", "Tidak dipakai X & Y, ...")
// supaya Sveltia tetap memakai definisi yang sama. Dijaga editor-hints.test.ts.
const ONLY = /Hanya (?:dipakai varian|untuk gaya) ([^.]+)\.\s*/;
const NOT = /Tidak dipakai ([^,.]+)[^.]*\.\s*/;
function variantValues(list: string, variants: Field['options'] = []) {
  return list.split(/\s*(?:&|,|\bdan\b)\s*/).map((n) => variants.find((o) => o.label.split(':')[0].trim().toLowerCase() === n.trim().toLowerCase())?.value);
}

/** false bila field tidak dipakai oleh varian section yang sedang aktif. */
export function usedByVariant(f: Field, variant: string | undefined, variants: Field['options']) {
  if (!variant || !variants?.length || !f.hint) return true;
  const only = f.hint.match(ONLY);
  if (only) return variantValues(only[1], variants).includes(variant);
  const not = f.hint.match(NOT);
  return not ? !variantValues(not[1], variants).includes(variant) : true;
}

/** Batas karakter untuk varian aktif: "Maks. 80 karakter (Showcase: 60)" → 60 saat Showcase. */
export function maxFor(f: Field, variant: string | undefined, variants: Field['options']) {
  const m = f.hint?.match(/Maks\. \d+ karakter \(([^:)]+): (\d+)\)/);
  return m && variant && variantValues(m[1], variants).includes(variant) ? Number(m[2]) : f.maxlength;
}

/** Hint tanpa info yang sudah terlihat di editor visual: syarat varian, batas karakter/jumlah (ada penghitung), cara menyembunyikan tombol (ada saklar), seret (editor pakai tombol naik/turun). */
export const editorHint = (hint = '') =>
  hint
    .replace(ONLY, '')
    .replace(NOT, '')
    .replace(/\s*Kosongkan teks tombol untuk menyembunyikan\./, '')
    .replace(/\s*Maks\. \d+ karakter( \([^)]*\))?\.?/, '')
    .replace(/\s*Maks\. \d+ (item|angka|kolom)\./, '')
    .replace(/\s*Seret untuk mengubah urutan\./, '')
    .trim();
