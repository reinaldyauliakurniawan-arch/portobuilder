// Menjaga public/admin/config.yml (scripts/cms-config.mjs) tetap sinkron dengan skema Zod.
import { describe, expect, it } from 'vitest';
import { collections, sectionTypes } from '../../scripts/cms-config.mjs';
import { aboutSchema, customPageSchema, homeSchema, navigationSchema, projectSchema, sectionSchemas, siteSchema, themeSchema, SECTION_TYPES } from './schemas';
import { variantsOf } from './dev-samples';

type Field = { name: string; options?: { value: string }[]; fields?: Field[] };
const names = (fields: Field[]) => fields.map((f) => f.name).sort();
const keys = (schema: { shape: Record<string, unknown> }) => Object.keys(schema.shape).sort();
const file = (col: string, f: string) => (collections as any[]).find((c) => c.name === col).files.find((x: any) => x.name === f).fields as Field[];
const folder = (col: string) => (collections as any[]).find((c) => c.name === col).fields as Field[];

describe('sinkron CMS ↔ Zod', () => {
  it('jenis section sama', () => expect(sectionTypes.map((t) => t.name).sort()).toEqual([...SECTION_TYPES].sort()));

  it.each(SECTION_TYPES)('field section %s sama', (type) => {
    const cms = sectionTypes.find((t) => t.name === type)!;
    expect(names(cms.fields as Field[])).toEqual(keys(sectionSchemas[type] as any).filter((k) => k !== 'type'));
    const variant = (cms.fields as Field[]).find((f) => f.name === 'variant')!;
    expect(variant.options!.map((o) => o.value)).toEqual(variantsOf(type));
  });

  it.each([
    ['settings', 'site', siteSchema],
    ['settings', 'theme', themeSchema],
    ['pages', 'home', homeSchema],
    ['pages', 'about', aboutSchema],
  ] as const)('field %s/%s sama', (col, f, schema) => expect(names(file(col, f))).toEqual(keys(schema as any)));

  it('field navigasi sama', () => expect(names(file('settings', 'navigation'))).toEqual(Object.keys((navigationSchema as any).shape).sort()));
  it('field halaman custom sama', () => expect(names(folder('custom_pages'))).toEqual(keys(customPageSchema as any)));
  it('field proyek sama (+ body markdown)', () => expect(names(folder('projects')).filter((n) => n !== 'body')).toEqual(keys(projectSchema as any)));
});
