<script lang="ts">
  import { ed } from '../state.svelte';
  import { SECTION_TYPES, sectionDef } from '../paths';
  import type { SectionType } from '../../lib/schemas';

  // Deskripsi singkat + sketsa tata letak (kotak-kotak) per jenis section.
  const INFO: Record<string, [string, string]> = {
    hero: ['Pembuka besar dengan judul, foto, dan tombol', 'M2 4h11v2H2zM2 8h9v1.5H2zM2 11h5v2H2zM15 3h7v10h-7z'],
    featuredProjects: ['Kartu proyek pilihan', 'M2 3h6v5H2zM9 3h6v5H9zM16 3h6v5h-6zM2 10h6v4H2zM9 10h6v4H9zM16 10h6v4h-6z'],
    richText: ['Paragraf, sub-judul, list, dan kutipan', 'M2 3h14v2H2zM2 7h20v1.2H2zM2 9.5h20v1.2H2zM2 12h14v1.2H2z'],
    video: ['Video YouTube yang diputar di halaman', 'M3 3h18v11H3zM10 6.5v4l3.5-2z'],
    aboutShort: ['Perkenalan singkat dengan foto', 'M2 3h8v11H2zM12 4h10v2H12zM12 8h9v1.2h-9zM12 10.5h7v1.2h-7z'],
    stats: ['Angka pencapaian, maks. 4', 'M2 5h4v3H2zM8 5h4v3H8zM14 5h4v3h-4zM20 5h2v3h-2zM2 10h4v1H2zM8 10h4v1H8zM14 10h4v1h-4z'],
    logos: ['Deretan logo klien', 'M2 7h3v3H2zM7 7h3v3H7zM12 7h3v3h-3zM17 7h3v3h-3z'],
    testimonials: ['Kutipan dari klien', 'M2 3h9v11H2zM13 3h9v11h-9z'],
    services: ['Daftar layanan dan harga', 'M2 3h6v11H2zM9 3h6v11H9zM16 3h6v11h-6z'],
    faq: ['Tanya-jawab yang bisa dibuka-tutup', 'M2 3h20v2.5H2zM2 7h20v2.5H2zM2 11h20v2.5H2z'],
    gallery: ['Kumpulan foto yang bisa diperbesar', 'M2 3h6v5H2zM9 3h6v8H9zM16 3h6v4h-6zM2 9h6v5H2zM16 8h6v6h-6z'],
    map: ['Peta Google Maps dan alamat', 'M2 3h8v11H2zM12 3h10v11H12z'],
    ctaBanner: ['Banner ajakan berwarna aksen', 'M2 4h20v9H2z'],
    contact: ['Form kontak, email, dan WhatsApp', 'M2 3h8v3H2zM12 3h10v2H12zM12 7h10v2H12zM12 11h6v2.5h-6z'],
  };
  const canInsert = $derived(!!ed.sections());
  // Sebut section patokannya dengan nama, bukan nomor urut.
  const after = $derived(ed.insertAt !== null ? ed.insertAt - 1 : ed.panel.kind === 'section' ? ed.panel.index : -1);
  const where = $derived(after >= 0 ? `di bawah section ${sectionDef(ed.sections()?.[after]?.type)?.label ?? ''}` : 'di bagian bawah halaman');
</script>

{#if canInsert}
  <p class="e-hint">Klik untuk menambahkan {where}.</p>
  <div class="e-insert-grid">
    {#each SECTION_TYPES as t}
      <button type="button" class="e-insert" onclick={() => ed.addSection(t.name as SectionType)}>
        <svg viewBox="0 0 24 17" aria-hidden="true"><path d={INFO[t.name]?.[1]} /></svg>
        <strong>{t.label}</strong>
        <span>{INFO[t.name]?.[0]}</span>
      </button>
    {/each}
  </div>
{:else}
  <p class="e-empty">
    Halaman {ed.pageTitle()} memakai tata letak tetap. Isinya diatur dari panel kanan; section tidak bisa ditambahkan di sini.
  </p>
{/if}
