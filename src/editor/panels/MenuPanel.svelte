<script lang="ts">
  import { ed } from '../state.svelte';
  import FieldForm from '../fields/FieldForm.svelte';
  import { fileFields } from '../paths';

  const navFields = fileFields('settings', 'navigation');
  // $derived memaksa mode runes; tanpa rune Svelte mengompilasi mode legacy dan panel tidak dirender.
  const nav = $derived(ed.content?.navigation);
</script>

{#if nav}
  <section class="e-sec">
    <h3>Menu navigasi</h3>
    <p class="e-hint">Menu navbar, tombol CTA, dan menu footer. Halaman custom juga bisa dimasukkan ke menu dari Pengaturan halaman-nya.</p>
    <FieldForm fields={navFields} value={nav} path="navigation" />
  </section>
{/if}
