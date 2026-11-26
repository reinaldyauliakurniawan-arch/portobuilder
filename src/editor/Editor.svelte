<script lang="ts">
  import { onMount } from 'svelte';
  import { ed, type PageRef, type Tab } from './state.svelte';
  import { githubStorage, loginWithNetlify, savedToken, tryLocal } from './storage';
  import { labelFor, fileFields, folderFields, sectionDef } from './paths';
  import Canvas from './Canvas.svelte';
  import InsertPanel from './panels/InsertPanel.svelte';
  import PagesPanel from './panels/PagesPanel.svelte';
  import MenuPanel from './panels/MenuPanel.svelte';
  import ThemePanel from './panels/ThemePanel.svelte';
  import SectionPanel from './panels/SectionPanel.svelte';
  import PagePanel from './panels/PagePanel.svelte';
  import FieldForm from './fields/FieldForm.svelte';
  import Icon from './Icon.svelte';

  let { repo, branch }: { repo: string; branch: string } = $props();
  let loginError = $state('');
  let side = $state<HTMLElement>();
  // Ganti panel/tab = mulai dari atas, bukan posisi scroll panel sebelumnya.
  $effect(() => {
    void ed.panel, ed.tab;
    side?.scrollTo(0, 0);
  });

  onMount(async () => {
    const local = await tryLocal();
    if (local) return ed.start(local);
    const token = savedToken();
    if (token) return ed.start(githubStorage(token, repo, branch));
    ed.status = 'login';
  });

  async function login() {
    loginError = '';
    try {
      const token = await loginWithNetlify();
      await ed.start(githubStorage(token, repo, branch));
    } catch (e) {
      loginError = (e as Error).message;
    }
  }

  function onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable]')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? ed.redo() : ed.undo();
    } else if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      ed.redo();
    }
  }

  const TABS: [Tab, string][] = [
    ['insert', 'Sisipkan'],
    ['pages', 'Halaman'],
    ['menu', 'Menu'],
    ['theme', 'Tema'],
    ['site', 'Situs'],
  ];

  const pageOptions = $derived.by(() => {
    const c = ed.content;
    if (!c) return [] as [string, string][];
    const base: PageRef[] = [{ kind: 'home' }, { kind: 'about' }, { kind: 'projects' }];
    const all = [...base, ...Object.keys(c.customPages).map((id) => ({ kind: 'custom', id }) as PageRef), ...Object.keys(c.projects).map((id) => ({ kind: 'project', id }) as PageRef)];
    return all.map((p) => [ed.pageKey(p), `${p.kind === 'project' ? 'Proyek: ' : ''}${ed.pageTitle(p)}`] as [string, string]);
  });
  function selectPage(key: string) {
    const [kind, id] = key.split(':');
    ed.openPage((id ? { kind, id } : { kind }) as PageRef);
  }

  const DOC_LABEL: Record<string, string> = { site: 'Pengaturan situs', theme: 'Tema', navigation: 'Menu navigasi', home: 'Beranda', about: 'About' };
  function problemLabel(doc: string, path: string) {
    const c = ed.content!;
    const [kind, id] = doc.split(':');
    const where = DOC_LABEL[doc] ?? (kind === 'custom' ? `Halaman ${c.customPages[id]?.title ?? id}` : `Proyek ${c.projects[id]?.data?.title ?? id}`);
    const sec = path.match(/^sections\.(\d+)\.?(.*)$/);
    if (sec) {
      const s = (kind === 'custom' ? c.customPages[id] : (c as any)[doc])?.sections?.[Number(sec[1])];
      const def = sectionDef(s?.type);
      return `${where} › ${def?.label ?? 'Section'}${sec[2] ? ` › ${labelFor(def?.fields ?? [], sec[2])}` : ''}`;
    }
    const fields =
      doc === 'site' ? fileFields('settings', 'site') : doc === 'navigation' ? fileFields('settings', 'navigation') : doc === 'about' ? fileFields('pages', 'about') : kind === 'custom' ? folderFields('custom_pages') : kind === 'project' ? folderFields('projects') : [];
    return path ? `${where} › ${labelFor(fields, path)}` : where;
  }
  function goTo(doc: string, path: string) {
    const [kind, id] = doc.split(':');
    ed.publishOpen = false;
    if (doc === 'site') return ((ed.panel = { kind: 'tabs' }), (ed.tab = 'site'));
    if (doc === 'navigation') return ((ed.panel = { kind: 'tabs' }), (ed.tab = 'menu'));
    if (doc === 'theme') return ((ed.panel = { kind: 'tabs' }), (ed.tab = 'theme'));
    ed.openPage((id ? { kind, id } : { kind }) as PageRef);
    const sec = path.match(/^sections\.(\d+)/);
    ed.panel = sec ? { kind: 'section', index: Number(sec[1]) } : kind === 'home' ? { kind: 'tabs' } : { kind: 'page' };
    ed.sidebarOpen = true;
  }
  // "Beranda · Hero, Statistik": section yang isinya beda dari versi tersimpan (dibandingkan per posisi).
  function changeDetail(path: string) {
    try {
      const [a, b] = [JSON.parse(ed.base[path] ?? '{}'), JSON.parse((ed.serialized as Record<string, string>)[path] ?? '{}')];
      if (!Array.isArray(b.sections)) return '';
      const label = (s: any) => sectionDef(s?.type)?.label ?? 'Section';
      const old: any[] = a.sections ?? [];
      const parts = b.sections.filter((s: any, i: number) => JSON.stringify(s) !== JSON.stringify(old[i])).map(label);
      if (old.length > b.sections.length) parts.push(`${old.length - b.sections.length} section dihapus`);
      const { sections: _a, ...restA } = a;
      const { sections: _b, ...restB } = b;
      if (JSON.stringify(restA) !== JSON.stringify(restB)) parts.unshift('pengaturan halaman');
      return [...new Set(parts)].join(', ');
    } catch {
      return '';
    }
  }
  const changeNames = $derived(Object.keys(ed.changes).map((p) => [ed.describe(p), changeDetail(p)] as const));
</script>

<svelte:window onkeydown={onKey} />

{#if ed.status === 'loading'}
  <div class="e-center"><div class="e-spin"></div><p>Memuat konten…</p></div>
{:else if ed.status === 'login'}
  <div class="e-center e-login">
    <h1>Editor situs</h1>
    <p>Masuk dengan akun GitHub yang sudah diundang ke repo situs ini.</p>
    <button type="button" class="e-btn e-primary e-big" onclick={login}>Masuk dengan GitHub</button>
    {#if loginError}<p class="e-error">{loginError}</p>{/if}
  </div>
{:else if ed.status === 'error'}
  <div class="e-center"><h1>Editor tidak bisa dibuka</h1><p class="e-error">{ed.error}</p><button class="e-btn" onclick={() => location.reload()}>Coba lagi</button></div>
{:else if ed.content}
  <div class="e-app" class:closed={!ed.sidebarOpen}>
    <header class="e-top">
      <strong class="e-brand">Editor</strong>
      <label class="e-sr" for="page-select">Halaman yang diedit</label>
      <select id="page-select" class="e-input e-page-select" value={ed.pageKey()} onchange={(e) => selectPage(e.currentTarget.value)}>
        {#each pageOptions as [k, l]}<option value={k}>{l}</option>{/each}
      </select>
      {#if ed.page.kind !== 'home' && ed.page.kind !== 'projects'}
        <button type="button" class="e-btn e-ghost e-pageset" title="Pengaturan halaman" onclick={() => ((ed.panel = { kind: 'page' }), (ed.sidebarOpen = true))}>
          <Icon name="settings" /><span class="e-lbl">Pengaturan</span>
        </button>
      {/if}
      <div class="e-spacer"></div>
      <div class="e-row e-tools">
        <button type="button" class="e-icon" title="Urungkan (Ctrl+Z)" aria-label="Urungkan" disabled={!ed.canUndo} onclick={() => ed.undo()}><Icon name="undo" /></button>
        <button type="button" class="e-icon" title="Ulangi (Ctrl+Shift+Z)" aria-label="Ulangi" disabled={!ed.canRedo} onclick={() => ed.redo()}><Icon name="redo" /></button>
        <span class="e-divider" aria-hidden="true"></span>
        <div class="e-devices" role="radiogroup" aria-label="Pratinjau perangkat">
          {#each [['desktop', 'Desktop'], ['tablet', 'Tablet'], ['mobile', 'HP']] as [d, l]}
            <button type="button" role="radio" title={l} aria-label={l} aria-checked={ed.device === d} class:on={ed.device === d} onclick={() => (ed.device = d as typeof ed.device)}><Icon name={d} /></button>
          {/each}
        </div>
      </div>
      <div class="e-spacer"></div>
      <span class="e-status" class:dirty={ed.dirty} aria-live="polite">{ed.dirty ? `${ed.dirty} perubahan belum ${ed.storage?.kind === 'local' ? 'disimpan' : 'dipublikasikan'}` : 'Tersimpan'}</span>
      <a class="e-btn e-ghost e-view" href={ed.pageUrl()} target="_blank" rel="noopener" title="Buka halaman ini di tab baru"><span class="e-lbl">Lihat situs</span><Icon name="external" size={14} /></a>
      {#if ed.dirty}
        <button type="button" class="e-btn e-ghost e-discard" title="Kembalikan semua ke versi terakhir yang disimpan (bisa diurungkan)" onclick={() => ed.discard()}>Buang perubahan</button>
      {/if}
      <button type="button" class="e-btn e-primary" disabled={!ed.dirty} onclick={() => ed.openPublish()}>{ed.storage?.kind === 'local' ? 'Simpan ke file' : 'Publikasikan'}</button>
      <button type="button" class="e-icon e-toggle" title={ed.sidebarOpen ? 'Tutup panel' : 'Buka panel'} aria-label={ed.sidebarOpen ? 'Tutup panel' : 'Buka panel'} aria-expanded={ed.sidebarOpen} class:on={ed.sidebarOpen} onclick={() => (ed.sidebarOpen = !ed.sidebarOpen)}><Icon name="panel" /></button>
    </header>

    <main class="e-main"><Canvas /></main>

    <aside class="e-side" aria-label="Panel editor" bind:this={side}>
      {#if ed.panel.kind === 'section'}
        <SectionPanel index={ed.panel.index} />
      {:else if ed.panel.kind === 'page'}
        <PagePanel />
      {:else}
        <div class="e-tabs" role="tablist" aria-label="Panel editor">
          {#each TABS as [t, l]}
            <button type="button" role="tab" aria-selected={ed.tab === t} class:on={ed.tab === t} onclick={() => (ed.tab = t)}>{l}</button>
          {/each}
        </div>
        <div class="e-tabpanel" role="tabpanel">
          {#if ed.tab === 'insert'}<InsertPanel />
          {:else if ed.tab === 'pages'}<PagesPanel />
          {:else if ed.tab === 'menu'}<MenuPanel />
          {:else if ed.tab === 'theme'}<ThemePanel />
          {:else}
            <section class="e-sec">
              <h3>Identitas & kontak</h3>
              <FieldForm fields={fileFields('settings', 'site')} value={ed.content.site} path="site" />
            </section>
          {/if}
        </div>
      {/if}
    </aside>
  </div>

  {#if ed.publishOpen}
    <!-- <dialog> native: Esc, focus trap, dan fokus awal dari browser. Klik backdrop = target dialog itu sendiri. -->
    <dialog class="e-modal-bg" aria-labelledby="pub-title" {@attach (d) => d.showModal()} onclose={() => (ed.publishOpen = false)} onclick={(e) => e.target === e.currentTarget && e.currentTarget.close()}>
      <div class="e-modal">
        <h2 id="pub-title">{ed.storage?.kind === 'local' ? 'Simpan perubahan ke file' : 'Publikasikan perubahan'}</h2>
        {#if ed.problems.length}
          <p>Perbaiki dulu {ed.problems.length} hal berikut sebelum {ed.storage?.kind === 'local' ? 'menyimpan' : 'mempublikasikan'}:</p>
          <ul class="e-problems">
            {#each ed.problems as p}
              <li><button type="button" onclick={() => goTo(p.doc, p.path)}><strong>{problemLabel(p.doc, p.path)}</strong><span>{p.message}</span></button></li>
            {/each}
          </ul>
        {:else}
          <p>Yang akan {ed.storage?.kind === 'local' ? 'disimpan' : 'dipublikasikan'}:</p>
          <ul class="e-changes">
            {#each changeNames as [name, detail]}<li>{name}{#if detail}<span class="e-change-detail">{` · ${detail}`}</span>{/if}</li>{/each}
          </ul>
          {#if ed.storage?.kind === 'github'}<p class="e-hint">Situs diperbarui otomatis dalam 1–3 menit setelah dipublikasikan.</p>{/if}
        {/if}
        <div class="e-row e-modal-actions">
          <button type="button" class="e-btn e-ghost" onclick={() => (ed.publishOpen = false)}>Batal</button>
          <button type="button" class="e-btn e-primary" disabled={!!ed.problems.length || !!ed.busy} onclick={() => ed.publish()}>{ed.busy || (ed.storage?.kind === 'local' ? 'Simpan' : 'Publikasikan')}</button>
        </div>
      </div>
    </dialog>
  {/if}

  {#if ed.staleDraft}
    <!-- Bukan confirm(): pilihan tombolnya harus jelas, dan draft lama bisa menimpa isi yang lebih baru. -->
    <dialog class="e-modal-bg" aria-labelledby="draft-title" aria-describedby="draft-desc" {@attach (d) => d.showModal()} oncancel={(e) => e.preventDefault()}>
      <div class="e-modal">
        <h2 id="draft-title">Ada draft lama yang belum {ed.storage?.kind === 'local' ? 'disimpan' : 'dipublikasikan'}</h2>
        <p id="draft-desc">Draft ini dibuat sebelum versi terakhir situs {ed.storage?.kind === 'local' ? 'disimpan' : 'dipublikasikan'}. Kalau dipulihkan, isinya bisa menimpa perubahan yang lebih baru.</p>
        <div class="e-row e-modal-actions">
          <button type="button" class="e-btn e-ghost" onclick={() => ed.resolveStaleDraft(false)}>Buang draft</button>
          <button type="button" class="e-btn e-primary" onclick={() => ed.resolveStaleDraft(true)}>Pulihkan draft</button>
        </div>
      </div>
    </dialog>
  {/if}
{/if}

{#if ed.toast}<div class="e-toast" role="status">{ed.toast}</div>{/if}
{#if ed.busy && !ed.publishOpen}<div class="e-toast" role="status">{ed.busy}</div>{/if}
