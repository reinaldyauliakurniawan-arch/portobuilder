import { describe, expect, it } from 'vitest';
import { YOUTUBE_PATTERN, YOUTUBE_PATTERN_SOURCE, parseYouTube, watchUrl } from './youtube';

const ID = 'dQw4w9WgXcQ';

describe('parseYouTube', () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`, { id: ID, start: 0, isShort: false }],
    [`youtube.com/watch?v=${ID}&list=PL123`, { id: ID, start: 0, isShort: false }],
    [`https://m.youtube.com/watch?v=${ID}`, { id: ID, start: 0, isShort: false }],
    [`https://youtu.be/${ID}`, { id: ID, start: 0, isShort: false }],
    [`https://youtu.be/${ID}?si=abc&t=42`, { id: ID, start: 42, isShort: false }],
    [`https://www.youtube.com/watch?v=${ID}&t=1m30s`, { id: ID, start: 90, isShort: false }],
    [`https://www.youtube.com/watch?v=${ID}&t=1h2m3s`, { id: ID, start: 3723, isShort: false }],
    [`https://www.youtube.com/shorts/${ID}`, { id: ID, start: 0, isShort: true }],
    [`https://youtube.com/shorts/${ID}?feature=share`, { id: ID, start: 0, isShort: true }],
    [`https://www.youtube.com/embed/${ID}`, { id: ID, start: 0, isShort: false }],
    [`https://www.youtube.com/embed/${ID}?start=15`, { id: ID, start: 15, isShort: false }],
    [`https://www.youtube-nocookie.com/embed/${ID}`, { id: ID, start: 0, isShort: false }],
    [`https://www.youtube.com/live/${ID}`, { id: ID, start: 0, isShort: false }],
  ])('%s', (url, expected) => expect(parseYouTube(url)).toEqual(expected));

  it.each(['https://vimeo.com/123456', 'https://www.youtube.com/watch?v=pendek', 'https://www.youtube.com/channel/UC123', 'bukan link'])(
    'menolak %s',
    (url) => expect(() => parseYouTube(url)).toThrow(/tidak valid/),
  );

  it('watchUrl menyertakan waktu mulai', () => expect(watchUrl({ id: ID, start: 42, isShort: false })).toBe(`https://www.youtube.com/watch?v=${ID}&t=42s`));
});

describe('pola validasi CMS', () => {
  it('regex source sama dengan regex Zod', () => expect(new RegExp(YOUTUBE_PATTERN_SOURCE).source).toBe(YOUTUBE_PATTERN.source));
  it('menolak link non-YouTube', () => {
    expect(YOUTUBE_PATTERN.test('https://vimeo.com/1')).toBe(false);
    expect(YOUTUBE_PATTERN.test('https://evil.com/youtube.com/x')).toBe(false);
    expect(YOUTUBE_PATTERN.test(`https://youtu.be/${ID}`)).toBe(true);
  });
});
