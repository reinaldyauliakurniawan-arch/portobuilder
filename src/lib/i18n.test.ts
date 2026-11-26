import { describe, expect, it } from 'vitest';
import { STRINGS } from './i18n-strings';

describe('kamus UI', () => {
  it('bahasa Inggris punya semua kunci bahasa Indonesia', () => expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.id).sort()));
  it('tidak ada teks kosong', () => {
    for (const dict of Object.values(STRINGS)) for (const v of Object.values(dict)) expect(v.trim()).not.toBe('');
  });
});
