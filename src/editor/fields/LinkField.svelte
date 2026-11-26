<script lang="ts">
  // Satu pemilih tujuan link (menggantikan 3 field terpisah di CMS lama).
  import { ed } from '../state.svelte';
  import type { Field } from '../paths';

  interface Props {
    value: Record<string, any>;
    path: string;
    withLabel?: boolean;
    labelDef?: Field;
    /** Label boleh kosong = tombol disembunyikan (CTA di section). */
    optional?: boolean;
    /** item menu navbar dengan submenu boleh tanpa link */
    allowNone?: boolean;
  }
  let { value, path, withLabel = false, labelDef, optional = false, allowNone = false }: Props = $props();

  const BUILTIN = [
    ['home', 'Beranda'],
    ['projects', 'Daftar Proyek'],
    ['about', 'About'],
    ['#kontak', 'Bagian Kontak'],
  ];
  const pages = $derived(Object.values(ed.content?.customPages ?? {}).sort((a: any, b: any) => a.title.localeCompare(b.title)));
  const shown = $derived(!optional || !!value.label);

  const current = $derived(
    value.linkType === 'builtin' ? `builtin:${value.builtinPage ?? 'home'}` : value.linkType === 'custom' ? `custom:${value.customPage ?? ''}` : value.linkType === 'external' ? 'external' : value.linkType === 'none' ? 'none' : 'builtin:home',
  );

  function pick(v: string) {
    ed.mutate(() => {
      const [kind, target = ''] = v.split(':');
      value.linkType = kind;
      value.builtinPage = kind === 'builtin' ? target : '';
      value.customPage = kind === 'custom' ? target : '';
      if (kind !== 'external') value.url = '';
    });
  }
  const setLabel = (v: string) => ed.mutate(() => (value.label = v), { group: `${path}.label` });
  const setUrl = (v: string) => ed.mutate(() => (value.url = v), { group: `${path}.url` });
  function toggle(on: boolean) {
    ed.mutate(() => {
      value.label = on ? 'Selengkapnya' : '';
      if (on && !value.linkType) {
        value.linkType = 'builtin';
        value.builtinPage = 'home';
      }
    });
  }
  const urlBad = $derived(value.linkType === 'external' && value.url && !/^(https?:\/\/|mailto:|tel:)/.test(value.url));
</script>

<div class="e-link">
  {#if optional}
    <label class="e-switch">
      <input type="checkbox" checked={shown} onchange={(e) => toggle(e.currentTarget.checked)} />
      <span>Tampilkan tombol</span>
    </label>
  {/if}
  {#if shown}
    {#if withLabel}
      <label class="e-label" for={`l-${path}`}>
        {labelDef?.label ?? 'Teks'}
        {#if labelDef?.maxlength}<span class="e-count">{String(value.label ?? '').length}/{labelDef.maxlength}</span>{/if}
      </label>
      <input id={`l-${path}`} class="e-input" value={value.label ?? ''} maxlength={labelDef?.maxlength} oninput={(e) => setLabel(e.currentTarget.value)} />
    {/if}
    <label class="e-label" for={`d-${path}`}>Tujuan link</label>
    <select id={`d-${path}`} class="e-input" value={current} onchange={(e) => pick(e.currentTarget.value)}>
      <optgroup label="Halaman bawaan">
        {#each BUILTIN as [v, l]}<option value={`builtin:${v}`}>{l}</option>{/each}
      </optgroup>
      {#if pages.length}
        <optgroup label="Halaman custom">
          {#each pages as p}<option value={`custom:${p.slug}`} disabled={p.draft}>{p.title} (/{p.slug}){p.draft ? ' · draft' : ''}</option>{/each}
        </optgroup>
      {/if}
      <option value="external">Link luar (URL)…</option>
      {#if allowNone}<option value="none">Tanpa link (hanya membuka dropdown)</option>{/if}
    </select>
    {#if value.linkType === 'external'}
      <input class="e-input" type="url" placeholder="https://…" aria-label="URL tujuan" value={value.url ?? ''} oninput={(e) => setUrl(e.currentTarget.value)} />
      {#if urlBad}<p class="e-error">Awali dengan https:// (atau mailto:, tel:)</p>{/if}
    {/if}
  {/if}
</div>
