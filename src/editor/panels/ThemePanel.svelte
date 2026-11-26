<script lang="ts">
  import { ed } from '../state.svelte';
  import { PRESETS, PRESET_IDS, resolveTheme, type PresetId } from '../../lib/themes';
  import { PRESET_FONTS } from '../../lib/fonts';

  const theme = $derived(ed.content!.theme);
  const result = $derived(resolveTheme({ preset: theme.preset, backgroundColor: theme.backgroundColor, textColor: theme.textColor, accentColor: theme.accentColor, motion: theme.motion }));
  const set = (k: string, v: string) => ed.mutate(() => (theme[k] = v), { group: `theme.${k}` });

  const COLORS = [
    ['backgroundColor', 'Latar', '--bg'],
    ['textColor', 'Teks', '--text'],
    ['accentColor', 'Aksen (tombol & link)', '--accent'],
  ] as const;
  const valid = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);
  const auto = $derived(theme.accentColor === 'auto');
  const adjusted = (token: string) => result.adjustments.find((a) => a.token === token);
</script>

<section class="e-sec">
  <h3>Preset</h3>
  <div class="e-presets" role="radiogroup" aria-label="Preset tema">
    {#each PRESET_IDS as id}
      {@const p = PRESETS[id as PresetId]}
      <button type="button" role="radio" aria-checked={theme.preset === id} class:on={theme.preset === id} onclick={() => set('preset', id)}>
        <span class="e-swatch" style:background={p.bg} style:color={p.text}>
          <span style:font-family={`'${PRESET_FONTS[id as PresetId].heading.family}', serif`}>Aa</span>
          <i style:background={p.accent}></i>
        </span>
        <span>{p.name}</span>
      </button>
    {/each}
  </div>
</section>

<section class="e-sec">
  <h3>Warna</h3>
  <p class="e-hint">Kosongkan untuk memakai warna preset. Warna yang kurang kontras otomatis digeser sedikit supaya tetap mudah dibaca.</p>
  {#each COLORS as [key, label, token]}
    {@const v = theme[key] ?? ''}
    <div class="e-field">
      <label class="e-label" for={`c-${key}`}>{label}</label>
      <div class="e-color">
        <input type="color" aria-label={`Pilih warna ${label}`} disabled={v === 'auto'} value={valid(v) ? v : result.vars[token]} oninput={(e) => set(key, e.currentTarget.value.toUpperCase())} />
        <input id={`c-${key}`} class="e-input" placeholder={`preset: ${result.vars[token]}`} value={v} disabled={v === 'auto'} oninput={(e) => set(key, e.currentTarget.value)} />
        {#if v}<button type="button" class="e-btn e-ghost" onclick={() => set(key, '')}>Reset</button>{/if}
      </div>
      {#if key === 'accentColor'}
        <label class="e-switch e-auto">
          <input type="checkbox" checked={auto} onchange={(e) => set('accentColor', e.currentTarget.checked ? 'auto' : '')} />
          <span>Ambil otomatis dari foto hero Beranda</span>
        </label>
        {#if auto}<p class="e-hint">Warna paling dominan & berwarna di foto hero dipakai sebagai aksen, lalu digeser bila perlu supaya kontras. Hasilnya terlihat di kanvas.</p>{/if}
      {/if}
      {#if v && v !== 'auto' && !valid(v)}<p class="e-error">Format hex 6 digit, contoh #C2410C</p>{/if}
      {#if adjusted(token)}
        {@const a = adjusted(token)!}
        <p class="e-hint">Digeser ke <span class="e-dot" style:background={a.to}></span>{a.to} supaya kontrasnya {a.ratio}:1.</p>
      {/if}
    </div>
  {/each}
</section>

<section class="e-sec">
  <h3>Animasi</h3>
  <div class="e-variants" role="radiogroup" aria-label="Level animasi">
    {#each [['full', 'Penuh'], ['subtle', 'Halus'], ['off', 'Mati']] as [v, l]}
      <button type="button" role="radio" aria-checked={theme.motion === v} class:on={theme.motion === v} onclick={() => set('motion', v)}>{l}</button>
    {/each}
  </div>
  <p class="e-hint">Animasi tidak diputar di kanvas editor; lihat hasilnya di situs setelah dipublikasikan.</p>
</section>
