import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CONTRAST_RULES, buildThemeColors, contrast, darkScheme, glassScrim, luminance, overlayAlpha, pickAccent, scrimAlpha } from './color';
import { PRESETS } from './themes';

function assertAllPairs(input: { bg: string; text: string; accent: string }) {
  const { vars } = buildThemeColors(input);
  for (const rule of CONTRAST_RULES) {
    for (const b of rule.bg) {
      const r = contrast(vars[rule.fg], vars[b]);
      if (r < rule.target) throw new Error(`${rule.fg} vs ${b} = ${r.toFixed(2)} < ${rule.target} untuk ${JSON.stringify(input)}`);
    }
  }
}

describe('rumus kontras WCAG', () => {
  it('hitam vs putih = 21:1', () => expect(contrast('#000', '#fff')).toBeCloseTo(21, 5));
  it('#777 di atas putih ≈ 4,48:1', () => expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2));
  it('warna sama = 1:1', () => expect(contrast('#C2410C', '#c2410c')).toBe(1));
  it('luminans putih = 1, hitam = 0', () => {
    expect(luminance('#fff')).toBe(1);
    expect(luminance('#000')).toBe(0);
  });
  it('warna tidak valid ditolak dengan pesan jelas', () => expect(() => luminance('bukan-warna')).toThrow(/Warna tidak valid/));
});

describe('engine tema', () => {
  it.each(Object.entries(PRESETS))('preset %s lolos AA', (_, p) => assertAllPairs(p));

  it.each([
    ['latar abu-abu tengah', { bg: '#777777', text: '#888888', accent: '#7a7a7a' }],
    ['kuning di atas putih', { bg: '#ffffff', text: '#ffff00', accent: '#ffff00' }],
    ['merah murni', { bg: '#ff0000', text: '#ff0000', accent: '#ff0000' }],
    ['teks = latar', { bg: '#F5F1EA', text: '#F5F1EA', accent: '#F5F1EA' }],
    ['hitam total', { bg: '#000000', text: '#000000', accent: '#000000' }],
    ['putih total', { bg: '#ffffff', text: '#ffffff', accent: '#ffffff' }],
  ])('kasus ekstrem: %s', (_, input) => assertAllPairs(input));

  it('latar tidak pernah diubah', () => {
    expect(buildThemeColors({ bg: '#777777', text: '#777777', accent: '#777777' }).vars['--bg']).toBe('#777777');
  });

  it('mempertahankan warna yang sudah lolos', () => {
    const { vars, adjustments } = buildThemeColors(PRESETS.mono);
    expect(vars['--text']).toBe('#0a0a0a');
    expect(adjustments).toEqual([]);
  });

  it('card mode gelap untuk latar gelap', () => {
    expect(buildThemeColors(PRESETS.midnight).cardMode).toBe('dark');
    expect(buildThemeColors(PRESETS.editorial).cardMode).toBe('light');
  });

  it('property: 10.000 kombinasi acak selalu lolos', () => {
    const hex = fc.integer({ min: 0, max: 0xffffff }).map((n) => '#' + n.toString(16).padStart(6, '0'));
    fc.assert(
      fc.property(hex, hex, hex, (bg, text, accent) => {
        assertAllPairs({ bg, text, accent });
      }),
      { numRuns: 10_000 },
    );
  }, 120_000);
});

describe('overlay teks di atas foto', () => {
  it('foto gelap tidak butuh overlay', () => expect(overlayAlpha(0.02)).toBe(0));
  it('foto putih butuh overlay cukup untuk 4,5:1', () => {
    const a = overlayAlpha(1);
    expect(a).toBeGreaterThan(0.4);
    // putih digelapkan (1-a) lalu dibandingkan dengan teks putih
    const g = Math.round(255 * (1 - a)).toString(16).padStart(2, '0');
    expect(contrast('#ffffff', `#${g}${g}${g}`)).toBeGreaterThanOrEqual(4.5);
  });
  it('monoton naik', () => expect(overlayAlpha(0.8)).toBeGreaterThanOrEqual(overlayAlpha(0.4)));
});

describe('aksen otomatis dari foto (pickAccent)', () => {
  const pixels = (colors: [string, number][]) => {
    const out: number[] = [];
    for (const [hex, n] of colors) {
      const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      for (let k = 0; k < n; k++) out.push(...v, 255);
    }
    return Uint8Array.from(out);
  };
  it('mengabaikan hitam, putih, dan abu', () => expect(pickAccent(pixels([['#000000', 500], ['#ffffff', 500], ['#808080', 500]]), 4)).toBeNull());
  it('memilih hue dominan, bukan yang paling sedikit', () => {
    const hex = pickAccent(pixels([['#000000', 800], ['#e0561f', 120], ['#c94a18', 60], ['#2a6fdb', 20]]), 4)!;
    const o = luminance(hex);
    expect(o).toBeGreaterThan(0);
    // oranye/merah, bukan biru
    expect(parseInt(hex.slice(1, 3), 16)).toBeGreaterThan(parseInt(hex.slice(5, 7), 16));
  });
  it('piksel transparan diabaikan', () => {
    const px = pixels([['#2a9d8f', 50]]);
    for (let i = 3; i < px.length; i += 4) px[i] = 0;
    expect(pickAccent(px, 4)).toBeNull();
  });
  it('hasilnya tetap lolos engine kontras di latar hitam', () => {
    const accent = pickAccent(pixels([['#7a1020', 200]]), 4)!;
    const { vars } = buildThemeColors({ bg: '#000000', text: '#ffffff', accent });
    expect(contrast(vars['--accent'], '#000000')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('kaca & skema gelap lokal', () => {
  it('kaca di atas foto gelap tidak butuh scrim', () => expect(glassScrim(0.01)).toBe(0));
  it('kaca di atas foto terang butuh scrim sampai teks putih 4,5:1', () => {
    for (const p95 of [0.3, 0.6, 1]) {
      const a = glassScrim(p95);
      const gray = p95 <= 0.0031308 ? p95 * 12.92 : 1.055 * p95 ** (1 / 2.4) - 0.055;
      const v = Math.round(255 * (gray * (1 - a) * (1 - 0.06) + 0.06));
      const hex = '#' + v.toString(16).padStart(2, '0').repeat(3);
      expect(contrast('#ffffff', hex)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('tint kaca yang lebih terang butuh scrim lebih kuat', () => expect(glassScrim(0.5, 0.2)).toBeGreaterThan(glassScrim(0.5, 0.06)));
  it.each(Object.entries(PRESETS))('skema gelap lokal di preset %s lolos AA', (_, p) => {
    const vars = darkScheme(p.bg, p.accent);
    expect(luminance(vars['--bg'])).toBeLessThan(0.05);
    for (const rule of CONTRAST_RULES) for (const b of rule.bg) expect(contrast(vars[rule.fg], vars[b])).toBeGreaterThanOrEqual(rule.target);
  });
});

describe('scrimAlpha (teks di atas foto)', () => {
  it('teks putih di foto gelap: tanpa scrim', () => expect(scrimAlpha(0.01, '#000000', '#ffffff', 3)).toBe(0));
  it('teks gelap di foto gelap butuh lapisan latar terang', () => {
    const a = scrimAlpha(0.02, '#ffffff', '#3b0a0f', 4.5);
    expect(a).toBeGreaterThan(0.3);
    expect(a).toBeLessThanOrEqual(1);
  });
  it('large text (3:1) butuh scrim lebih tipis dari teks biasa (4,5:1)', () => expect(scrimAlpha(0.7, '#000000', '#ffffff', 3)).toBeLessThan(scrimAlpha(0.7, '#000000', '#ffffff', 4.5)));
});
