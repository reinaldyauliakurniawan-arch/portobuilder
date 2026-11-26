<script lang="ts">
  import Icon from '../Icon.svelte';
  import { ed } from '../state.svelte';
  import type { Field } from '../paths';

  interface Props {
    def: Field;
    value: Record<string, any>;
    path: string;
  }
  let { def, value }: Props = $props();
  let draft = $state('');
  const tags = $derived<string[]>(value[def.name] ?? []);
  const max = $derived(def.field?.maxlength);

  function add() {
    const t = draft.trim().slice(0, max);
    if (!t) return;
    ed.mutate(() => {
      if (!Array.isArray(value[def.name])) value[def.name] = [];
      value[def.name].push(t);
    });
    draft = '';
  }
</script>

<div class="e-field">
  <span class="e-label">{def.label}</span>
  {#if editorHint(def.hint)}<p class="e-hint">{editorHint(def.hint)}</p>{/if}
  <ul class="e-tags">
    {#each tags as t, i}
      <li>{t}<button type="button" aria-label={`Hapus ${t}`} onclick={() => ed.mutate(() => value[def.name].splice(i, 1))}><Icon name="x" size={12} /></button></li>
    {/each}
  </ul>
  <div class="e-row">
    <input class="e-input" placeholder="Ketik lalu Enter" maxlength={max} bind:value={draft} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
    <button type="button" class="e-btn" onclick={add}>Tambah</button>
  </div>
</div>
