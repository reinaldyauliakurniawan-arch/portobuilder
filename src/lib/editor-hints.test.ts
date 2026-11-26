import { describe, expect, it } from 'vitest';
import { editorHint, maxFor, usedByVariant, SECTION_TYPES, type Field } from '../editor/paths';

describe('hint varian di editor', () => {
  // Setiap hint "Hanya dipakai varian X" harus menunjuk varian yang ada; kalau tidak, field-nya hilang di semua varian.
  it.each(SECTION_TYPES.map((t) => [t.name, t] as const))('%s: nama varian di hint dikenali', (_, t) => {
    const variants = t.fields.find((f) => f.name === 'variant')?.options ?? [];
    for (const f of t.fields) {
      if (!/Hanya (dipakai varian|untuk gaya)|Tidak dipakai/.test(f.hint ?? '')) continue;
      expect(variants.some((v) => usedByVariant(f, v.value, variants)), f.name).toBe(true);
      expect(variants.some((v) => !usedByVariant(f, v.value, variants)), f.name).toBe(true);
    }
  });

  it('hero: field sesuai varian', () => {
    const hero = SECTION_TYPES.find((t) => t.name === 'hero')!;
    const v = hero.fields.find((f) => f.name === 'variant')!.options;
    const f = (n: string) => hero.fields.find((x) => x.name === n) as Field;
    expect(usedByVariant(f('cutoutImage'), 'cutout', v)).toBe(true);
    expect(usedByVariant(f('cutoutImage'), 'split', v)).toBe(false);
    expect(usedByVariant(f('headline'), 'spotlight', v)).toBe(false);
    expect(usedByVariant(f('headline'), 'showcase', v)).toBe(true);
    expect(usedByVariant(f('videoMp4'), 'fullbleed', v)).toBe(true);
    expect(usedByVariant(f('serviceColumns'), 'showcase', v)).toBe(true);
  });

  it('batas karakter per varian', () => {
    const hero = SECTION_TYPES.find((t) => t.name === 'hero')!;
    const v = hero.fields.find((f) => f.name === 'variant')!.options;
    const eyebrow = hero.fields.find((x) => x.name === 'eyebrow')!;
    expect(maxFor(eyebrow, 'showcase', v)).toBe(32);
    expect(maxFor(eyebrow, 'split', v)).toBe(40);
  });

  it('hint dibersihkan', () => {
    expect(editorHint('Hanya dipakai varian Cutout. Kosong = kata pertama nama. Maks. 16 karakter')).toBe('Kosong = kata pertama nama.');
    expect(editorHint('Penjelasan singkat di bawah judul. Maks. 160 karakter')).toBe('Penjelasan singkat di bawah judul.');
    expect(editorHint('Contoh: "A · B". Maks. 40 karakter (Showcase: 32)')).toBe('Contoh: "A · B".');
    expect(editorHint('Maks. 6 item. Seret untuk mengubah urutan. Halaman custom harus dibuat dulu sebelum bisa ditautkan.')).toBe('Halaman custom harus dibuat dulu sebelum bisa ditautkan.');
    expect(editorHint('Tombol berwarna aksen. Kosongkan teks tombol untuk menyembunyikan.')).toBe('Tombol berwarna aksen.');
  });
});
