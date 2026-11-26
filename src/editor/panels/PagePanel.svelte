<script lang="ts">
  // Pengaturan halaman aktif: halaman custom (judul, alamat, header, SEO, draft), About, atau proyek.
  import { ed } from '../state.svelte';
  import FieldForm from '../fields/FieldForm.svelte';
  import { fileFields, folderFields } from '../paths';
  import Icon from '../Icon.svelte';

  let slugDraft = $state('');
  let confirmDelete = $state(false);
  const page = $derived(ed.page);
  const doc = $derived(ed.doc());
  $effect(() => {
    slugDraft = page.kind === 'custom' ? (doc?.slug ?? '') : '';
    confirmDelete = false;
  });
</script>

<div class="e-panel-head">
  <button type="button" class="e-icon e-back" title="Kembali" aria-label="Kembali ke daftar" onclick={() => (ed.panel = { kind: 'tabs' })}><Icon name="back" /></button>
  <h2>{page.kind === 'project' ? 'Proyek' : 'Pengaturan halaman'}</h2>
</div>

{#if page.kind === 'custom' && doc}
  <div class="e-field">
    <label class="e-label" for="slug">Alamat URL</label>
    <div class="e-row">
      <span class="e-prefix">/</span>
      <input id="slug" class="e-input" bind:value={slugDraft} maxlength="60" />
      <button type="button" class="e-btn" disabled={slugDraft === doc.slug} onclick={() => ed.renameSlug(page.id, slugDraft)}>Simpan</button>
    </div>
    <p class="e-hint">Link di menu dan tombol ikut diperbarui otomatis.</p>
  </div>
  <div class="e-row e-actions">
    <button type="button" class="e-btn" onclick={() => ed.toggleMenu(page.id)}>{ed.inMenu(doc.slug) ? 'Keluarkan dari menu' : 'Masukkan ke menu navbar'}</button>
    <button type="button" class="e-btn" onclick={() => ed.setDraft(page.id, !doc.draft)}>{doc.draft ? 'Terbitkan' : 'Jadikan draft'}</button>
    <button type="button" class="e-btn" onclick={() => ed.duplicateCustomPage(page.id)}>Duplikat</button>
  </div>
  <div class="e-form">
    <FieldForm fields={folderFields('custom_pages')} value={doc} path={`custom-${page.id}`} skip={['slug', 'sections', 'draft']} />
  </div>
  <div class="e-dangerzone">
    {#if confirmDelete}
      <p>Hapus "{doc.title}"? Link ke halaman ini di menu ikut dihapus. Bisa diurungkan dengan Ctrl+Z sebelum dipublikasikan.</p>
      <div class="e-row">
        <button type="button" class="e-btn e-danger" onclick={() => ed.deleteCustomPage(page.id)}>Ya, hapus halaman</button>
        <button type="button" class="e-btn e-ghost" onclick={() => (confirmDelete = false)}>Batal</button>
      </div>
    {:else}
      <button type="button" class="e-btn e-danger" onclick={() => (confirmDelete = true)}>Hapus halaman</button>
    {/if}
  </div>
{:else if page.kind === 'about' && doc}
  <div class="e-form">
    <FieldForm fields={fileFields('pages', 'about')} value={doc} path="about" />
  </div>
{:else if page.kind === 'project' && doc}
  <div class="e-form">
    <FieldForm fields={folderFields('projects').filter((f) => f.name !== 'body')} value={doc.data} path={`project-${page.id}`} />
    <FieldForm fields={folderFields('projects').filter((f) => f.name === 'body')} value={doc} path={`project-${page.id}`} />
  </div>
  <div class="e-dangerzone">
    {#if confirmDelete}
      <p>Hapus proyek "{doc.data.title}"?</p>
      <div class="e-row">
        <button type="button" class="e-btn e-danger" onclick={() => ed.deleteProject(page.id)}>Ya, hapus proyek</button>
        <button type="button" class="e-btn e-ghost" onclick={() => (confirmDelete = false)}>Batal</button>
      </div>
    {:else}
      <button type="button" class="e-btn e-danger" onclick={() => (confirmDelete = true)}>Hapus proyek</button>
    {/if}
  </div>
{:else}
  <p class="e-empty">Halaman ini tidak punya pengaturan tambahan.</p>
{/if}
