<script lang="ts">
  import { ed } from '../state.svelte';
  import type { Field } from '../paths';

  interface Props {
    def: Field;
    id: string;
    value: string;
    onchange: (v: string) => void;
  }
  let { def, id, value, onchange }: Props = $props();
  let input: HTMLInputElement;
  const isImage = $derived(def.widget === 'image');
  const accept = $derived(isImage ? 'image/*' : def.accept ?? (def.name === 'videoMp4' ? 'video/mp4' : '*/*'));

  async function choose(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    const path = await ed.upload(file);
    if (path) {
      onchange(path);
      ed.measureImages();
    }
    input.value = '';
  }
</script>

<div class="e-media">
  {#if value && isImage}
    <img src={ed.mediaUrl(value)} alt="" />
  {:else if value}
    <a class="e-file" href={ed.mediaUrl(value)} target="_blank" rel="noopener">{value.split('/').pop()}</a>
  {/if}
  <div class="e-row">
    <button type="button" class="e-btn" onclick={() => input.click()}>{value ? 'Ganti' : 'Upload'} {isImage ? 'gambar' : 'file'}</button>
    <!-- Selalu bisa dihapus; field wajib yang kosong dicegat validasi sebelum publish. -->
    {#if value}<button type="button" class="e-btn e-danger" onclick={() => onchange('')}>Hapus {isImage ? 'gambar' : 'file'}</button>{/if}
  </div>
  <input {id} bind:this={input} type="file" {accept} hidden onchange={choose} />
</div>
