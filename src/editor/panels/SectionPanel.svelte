<script lang="ts">
  import { ed } from '../state.svelte';
  import FieldForm from '../fields/FieldForm.svelte';
  import { sectionDef } from '../paths';
  import Icon from '../Icon.svelte';

  let { index }: { index: number } = $props();
  const section = $derived(ed.sections()?.[index]);
  const def = $derived(section ? sectionDef(section.type) : undefined);
  const count = $derived(ed.sections()?.length ?? 0);
</script>

{#if section && def}
  <div class="e-panel-head">
    <button type="button" class="e-icon e-back" title="Kembali" aria-label="Kembali ke daftar" onclick={() => (ed.panel = { kind: 'tabs' })}><Icon name="back" /></button>
    <h2>{def.label}</h2>
    <div class="e-head-tools">
      <button type="button" class="e-icon" title="Naikkan" aria-label="Naikkan section" disabled={index === 0} onclick={() => ed.moveSection(index, index - 1)}><Icon name="up" /></button>
      <button type="button" class="e-icon" title="Turunkan" aria-label="Turunkan section" disabled={index === count - 1} onclick={() => ed.moveSection(index, index + 1)}><Icon name="down" /></button>
      <button type="button" class="e-icon" title="Duplikat" aria-label="Duplikat section" onclick={() => ed.duplicateSection(index)}><Icon name="copy" /></button>
      <button type="button" class="e-icon danger" title="Hapus (bisa diurungkan)" aria-label="Hapus section" onclick={() => ed.deleteSection(index)}><Icon name="trash" /></button>
    </div>
  </div>
  <p class="e-hint">Teks bisa diubah langsung dengan klik di halaman. Gambar, gaya, tombol, dan daftar item diatur di sini.</p>
  <div class="e-form">
    <FieldForm fields={def.fields} value={section} path={`s${index}`} />
  </div>
{/if}
