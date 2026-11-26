<script lang="ts">
  import { ed, type PageRef } from '../state.svelte';
  import Icon from '../Icon.svelte';

  let newTitle = $state('');
  let adding = $state(false);
  const custom = $derived(Object.entries(ed.content?.customPages ?? {}).sort(([, a]: any, [, b]: any) => a.title.localeCompare(b.title)));
  const projects = $derived(
    Object.entries(ed.content?.projects ?? {}).sort(([, a]: any, [, b]: any) => (a.data.order ?? 1e9) - (b.data.order ?? 1e9) || b.data.year - a.data.year),
  );
  const active = (p: PageRef) => ed.pageKey(p) === ed.pageKey();

  function create() {
    const t = newTitle.trim();
    if (!t) return;
    ed.addCustomPage(t.slice(0, 80));
    newTitle = '';
    adding = false;
  }
</script>

<section class="e-sec">
  <h3>Halaman</h3>
  <ul class="e-pages">
    {#each [{ kind: 'home' }, { kind: 'about' }, { kind: 'projects' }] as p}
      <li>
        <button type="button" class:on={active(p as PageRef)} onclick={() => ed.openPage(p as PageRef)}>
          <span>{ed.pageTitle(p as PageRef)}</span><small>{ed.pageUrl(p as PageRef)}</small>
        </button>
      </li>
    {/each}
    {#each custom as [id, p]}
      <li>
        <button type="button" class:on={active({ kind: 'custom', id })} onclick={() => ed.openPage({ kind: 'custom', id })}>
          <span>{p.title}{#if p.draft} <em class="e-chip">draft</em>{/if}{#if ed.inMenu(p.slug)} <em class="e-chip menu">di menu</em>{/if}</span>
          <small>/{p.slug}</small>
        </button>
      </li>
    {/each}
  </ul>
  {#if adding}
    <form class="e-row" onsubmit={(e) => (e.preventDefault(), create())}>
      <!-- svelte-ignore a11y_autofocus -->
      <input class="e-input" placeholder="Judul halaman, mis. Layanan" maxlength="80" bind:value={newTitle} autofocus />
      <button class="e-btn e-primary" type="submit">Buat</button>
    </form>
  {:else}
    <button type="button" class="e-btn e-add" onclick={() => (adding = true)}><Icon name="plus" size={14} />Halaman baru</button>
  {/if}
</section>

<section class="e-sec">
  <h3>Proyek</h3>
  <ul class="e-pages">
    {#each projects as [id, p]}
      <li>
        <button type="button" class:on={active({ kind: 'project', id })} onclick={() => ed.openPage({ kind: 'project', id })}>
          <span>{p.data.title}{#if p.data.draft} <em class="e-chip">draft</em>{/if}{#if p.data.featured} <em class="e-chip menu">unggulan</em>{/if}</span>
          <small>{p.data.category} · {p.data.year}</small>
        </button>
      </li>
    {/each}
  </ul>
  <button type="button" class="e-btn e-add" onclick={() => ed.addProject()}><Icon name="plus" size={14} />Proyek baru</button>
</section>
