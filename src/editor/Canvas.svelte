<script lang="ts">
  import { ICONS } from './icons';
  import { ed } from './state.svelte';
  import { fieldAt, folderFields, fileFields, getAt, labelFor, maxFor, sectionDef, setAt, type Field } from './paths';

  let iframe: HTMLIFrameElement;
  let loadedKey = '';
  let shown = $state(false); // kanvas pertama kali tampil
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ctrl: AbortController | null = null;

  // Render ulang setiap renderTick berubah (perubahan struktur, ganti halaman, undo...).
  $effect(() => {
    void ed.renderTick;
    if (ed.status !== 'ready') return;
    const key = ed.pageKey();
    clearTimeout(timer);
    timer = setTimeout(() => render(key), 120);
  });

  // Sorot section terpilih tanpa render ulang.
  $effect(() => {
    const idx = ed.panel.kind === 'section' ? ed.panel.index : -1;
    const doc = iframe?.contentDocument;
    doc?.querySelectorAll('[data-section]').forEach((el) => el.classList.toggle('pb-selected', Number((el as HTMLElement).dataset.section) === idx));
  });

  async function render(key: string) {
    ctrl?.abort();
    ctrl = new AbortController();
    ed.rendering = true;
    try {
      const res = await fetch('/edit/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-portobuilder-preview': '1' },
        body: JSON.stringify(ed.payload()),
        signal: ctrl.signal,
      });
      if (res.status === 422) {
        ed.renderErrors = ((await res.json()) as { errors: typeof ed.renderErrors }).errors;
        return;
      }
      if (!res.ok) {
        ed.renderErrors = [{ path: '', message: `Kanvas gagal dirender (${res.status}). Coba lagi sebentar.` }];
        return;
      }
      ed.renderErrors = [];
      const html = await res.text();
      const doc = iframe.contentDocument;
      if (key !== loadedKey || !doc?.body?.dataset.pbReady) {
        loadedKey = key;
        iframe.srcdoc = html;
      } else patch(doc, html);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') ed.renderErrors = [{ path: '', message: 'Tidak bisa menghubungi server kanvas.' }];
    } finally {
      ed.rendering = false;
    }
  }

  const themeStyle = (d: Document) => [...d.querySelectorAll('head style')].find((s) => s.textContent?.includes(':root{--bg'));

  function patch(doc: Document, html: string) {
    const next = new DOMParser().parseFromString(html, 'text/html');
    for (const a of ['data-theme', 'data-card']) doc.documentElement.setAttribute(a, next.documentElement.getAttribute(a) ?? '');
    const cur = themeStyle(doc);
    const nx = themeStyle(next);
    if (cur && nx) cur.textContent = nx.textContent;
    const y = doc.defaultView?.scrollY ?? 0;
    doc.body.innerHTML = next.body.innerHTML;
    doc.defaultView?.scrollTo(0, y);
    decorate(doc);
  }

  function onLoad() {
    // load pertama (about:blank) bisa terpicu sebelum bind:this terpasang
    const doc = iframe?.contentDocument;
    if (!doc?.body) return;
    doc.body.dataset.pbReady = '1';
    shown = true;
    injectStyle(doc);
    bind(doc);
    decorate(doc);
  }

  // ---------- dekorasi kanvas ----------

  const svg = (n: string) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;

  function injectStyle(doc: Document) {
    if (doc.getElementById('pb-editor-style')) return;
    const s = doc.createElement('style');
    s.id = 'pb-editor-style';
    s.textContent = `
      [data-section]{position:relative}
      [data-section]:hover{outline:1px dashed #2563eb;outline-offset:-1px}
      [data-section].pb-selected{outline:2px solid #2563eb;outline-offset:-2px}
      [data-section][data-hidden]{opacity:.9}
      .pb-bar{position:absolute;top:12px;left:12px;z-index:60;display:none;gap:2px;padding:4px;background:#111827;border-radius:10px;box-shadow:0 4px 16px rgb(0 0 0/.25);font:500 12px/1 system-ui,sans-serif}
      /* Hanya saat hover/fokus: section terpilih sudah punya aksi di panel, dan bar permanen menutupi isi (mis. navbar). */
      [data-section]:hover>.pb-bar,.pb-bar:focus-within{display:flex}
      /* Di batas atas section (bukan di atas isinya), kecuali section pertama yang tidak punya ruang di atasnya. */
      [data-section]:not([data-section="0"])>.pb-bar{top:0;translate:0 -100%;border-radius:10px 10px 0 0}
      .pb-bar button{all:unset;display:grid;place-items:center;width:30px;height:30px;border-radius:7px;color:#f9fafb;cursor:pointer}
      .pb-bar button:hover{background:#374151}.pb-bar button[data-act=drag]{cursor:grab}
      .pb-bar .pb-name{color:#d1d5db;padding:0 8px 0 6px;align-self:center;white-space:nowrap}
      .pb-add{all:unset;box-sizing:border-box;position:absolute;left:50%;bottom:-16px;z-index:61;translate:-50% 0;display:none;width:32px;height:32px;border-radius:999px;background:#2563eb;color:#fff;place-items:center;cursor:pointer;box-shadow:0 2px 8px rgb(0 0 0/.25)}
      [data-section]:hover>.pb-add{display:grid}
      [data-edit]{cursor:text;border-radius:3px;transition:box-shadow .15s}
      [data-edit]:hover{box-shadow:0 0 0 2px rgb(37 99 235/.45)}
      [data-edit][contenteditable]{box-shadow:0 0 0 2px #2563eb;outline:none}
      .pb-count{position:absolute;z-index:70;padding:3px 7px;border-radius:6px;background:#111827;color:#fff;font:500 11px/1.2 system-ui,sans-serif;pointer-events:none}
      .pb-count.pb-over{background:#b91c1c}
      .pb-drop{position:absolute;left:0;right:0;height:4px;background:#2563eb;z-index:80;pointer-events:none}
      a,button,summary{cursor:default}
    `;
    doc.head.appendChild(s);
  }

  function decorate(doc: Document) {
    const list = ed.sections() ?? [];
    doc.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => {
      const i = Number(el.dataset.section);
      const s = list[i];
      if (!s) return;
      const label = sectionDef(s.type)?.label ?? s.type;
      el.querySelector(':scope > .pb-bar')?.remove();
      const bar = doc.createElement('div');
      bar.className = 'pb-bar';
      bar.innerHTML =
        `<button data-act="drag" title="Seret untuk memindah" aria-label="Seret section">${svg('drag')}</button>` +
        `<span class="pb-name">${label.replace(/</g, '&lt;')}${s.enabled ? '' : ' (tersembunyi)'}</span>` +
        `<button data-act="up" title="Naikkan" aria-label="Naikkan section">${svg('up')}</button>` +
        `<button data-act="down" title="Turunkan" aria-label="Turunkan section">${svg('down')}</button>` +
        `<button data-act="copy" title="Duplikat" aria-label="Duplikat section">${svg('copy')}</button>` +
        `<button data-act="toggle" title="${s.enabled ? 'Sembunyikan' : 'Tampilkan'}" aria-label="${s.enabled ? 'Sembunyikan' : 'Tampilkan'} section">${svg('eye')}</button>` +
        `<button data-act="delete" title="Hapus" aria-label="Hapus section">${svg('trash')}</button>`;
      el.prepend(bar);
      el.querySelector(':scope > .pb-add')?.remove();
      const add = doc.createElement('button');
      add.className = 'pb-add';
      add.dataset.act = 'add';
      add.title = 'Tambah section di bawah ini';
      add.innerHTML = svg('plus');
      el.append(add);
      el.classList.toggle('pb-selected', ed.panel.kind === 'section' && ed.panel.index === i);
    });
    // File yang baru di-upload (belum ada di server) ditampilkan dari blob.
    doc.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      const src = img.getAttribute('src') ?? '';
      if (ed.uploads[src]) img.src = ed.uploads[src].url;
    });
    doc.querySelectorAll<HTMLVideoElement>('video[data-src]').forEach((v) => {
      const src = v.dataset.src ?? '';
      if (ed.uploads[src]) v.poster = '';
    });
  }

  // ---------- interaksi ----------

  function fieldsFor(section: number | null, path: string): { def?: Field; label: string } {
    if (path.startsWith('page.')) {
      const rest = path.slice(5);
      const fields =
        ed.page.kind === 'about' ? fileFields('pages', 'about') : ed.page.kind === 'project' ? folderFields('projects') : folderFields('custom_pages');
      return { def: fieldAt(fields, rest), label: labelFor(fields, rest) };
    }
    const s = ed.sections()?.[section ?? -1];
    const fields = sectionDef(s?.type)?.fields ?? [];
    return { def: fieldAt(fields, path), label: `${sectionDef(s?.type)?.label ?? ''} › ${labelFor(fields, path)}` };
  }

  let editing: { el: HTMLElement; abs: string; max?: number; badge: HTMLElement; before: string } | null = null;

  function startEdit(doc: Document, el: HTMLElement, e: MouseEvent) {
    if (editing?.el === el) return;
    stopEdit();
    const sec = el.closest<HTMLElement>('[data-section]');
    const section = sec ? Number(sec.dataset.section) : null;
    const path = el.dataset.edit!;
    const { def } = fieldsFor(section, path);
    const abs = ed.absPath(section, path);
    if (section !== null) ed.panel = { kind: 'section', index: section };
    try {
      el.contentEditable = 'plaintext-only';
    } catch {
      el.contentEditable = 'true';
    }
    el.spellcheck = true;
    const badge = doc.createElement('div');
    badge.className = 'pb-count';
    doc.body.append(badge);
    const s = section !== null ? ed.sections()?.[section] : undefined;
    const max = def && maxFor(def, s?.variant, sectionDef(s?.type)?.fields.find((x) => x.name === 'variant')?.options);
    editing = { el, abs, max: max || undefined, badge, before: el.textContent ?? '' };
    el.focus();
    const range = (doc as any).caretRangeFromPoint?.(e.clientX, e.clientY) as Range | null;
    if (range) {
      const sel = doc.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    updateBadge();
  }

  function updateBadge() {
    if (!editing) return;
    const { el, badge, max } = editing;
    const n = (el.textContent ?? '').length;
    badge.textContent = max ? `${n}/${max}` : `${n} karakter`;
    badge.classList.toggle('pb-over', !!max && n > max);
    const r = el.getBoundingClientRect();
    const win = el.ownerDocument.defaultView!;
    badge.style.left = `${r.left + win.scrollX}px`;
    badge.style.top = `${r.top + win.scrollY - 26}px`;
  }

  function onInput() {
    if (!editing) return;
    const text = (editing.el.textContent ?? '').replace(/\s+/g, ' ');
    const abs = editing.abs;
    ed.mutate((c) => setAt(c, abs, text), { group: abs, render: false });
    updateBadge();
  }

  function stopEdit() {
    if (!editing) return;
    const { el, badge, abs } = editing;
    el.removeAttribute('contenteditable');
    badge.remove();
    const val = getAt(ed.content, abs);
    if (typeof val === 'string' && val !== val.trim()) ed.mutate((c) => setAt(c, abs, val.trim()), { group: abs, render: false });
    editing = null;
    ed.renderTick++; // rapikan tampilan (mis. field yang dikosongkan menghilang)
  }

  function act(name: string, i: number) {
    if (name === 'up') ed.moveSection(i, i - 1);
    else if (name === 'down') ed.moveSection(i, i + 1);
    else if (name === 'copy') ed.duplicateSection(i);
    else if (name === 'toggle') ed.toggleSection(i);
    else if (name === 'delete') ed.deleteSection(i);
    else if (name === 'add') {
      ed.insertAt = i + 1;
      ed.panel = { kind: 'tabs' };
      ed.tab = 'insert';
      ed.sidebarOpen = true;
      ed.say('Pilih section yang ingin ditambahkan dari panel Sisipkan.');
    }
  }

  function startDrag(doc: Document, from: number, e: PointerEvent) {
    const win = doc.defaultView!;
    const line = doc.createElement('div');
    line.className = 'pb-drop';
    doc.body.append(line);
    let to = from;
    const els = [...doc.querySelectorAll<HTMLElement>('[data-section]')];
    const move = (ev: PointerEvent) => {
      let best = els.length;
      for (let k = 0; k < els.length; k++) {
        const r = els[k].getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) {
          best = k;
          break;
        }
      }
      const ref = els[Math.min(best, els.length - 1)].getBoundingClientRect();
      line.style.top = `${(best === els.length ? ref.bottom : ref.top) + win.scrollY - 2}px`;
      to = best > from ? best - 1 : best;
      if (ev.clientY < 60) win.scrollBy(0, -20);
      if (ev.clientY > win.innerHeight - 60) win.scrollBy(0, 20);
    };
    const up = () => {
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', up);
      line.remove();
      const ids = els.map((el) => Number(el.dataset.section));
      ed.moveSection(from, ids[to] ?? to);
    };
    doc.addEventListener('pointermove', move);
    doc.addEventListener('pointerup', up);
    move(e);
  }

  function bind(doc: Document) {
    doc.addEventListener(
      'click',
      (e) => {
        const t = e.target as HTMLElement;
        const btn = t.closest<HTMLElement>('[data-act]');
        const sec = t.closest<HTMLElement>('[data-section]');
        if (btn && sec) {
          e.preventDefault();
          e.stopPropagation();
          act(btn.dataset.act!, Number(sec.dataset.section));
          return;
        }
        const editable = t.closest<HTMLElement>('[data-edit]');
        if (editable) {
          e.preventDefault();
          e.stopPropagation();
          startEdit(doc, editable, e);
          return;
        }
        // Mode edit: link, tombol, dan form tidak berjalan.
        if (t.closest('a, button, input, textarea, select, label, lite-youtube')) e.preventDefault();
        if (t.closest('summary')) e.preventDefault();
        stopEdit();
        if (sec) {
          ed.panel = { kind: 'section', index: Number(sec.dataset.section) };
          ed.sidebarOpen = true;
        } else if (t.closest('.site-header, .site-footer')) {
          ed.panel = { kind: 'tabs' };
          ed.tab = 'menu';
          ed.sidebarOpen = true;
        } else if (t.closest('main')) {
          ed.panel = ed.page.kind === 'home' || ed.page.kind === 'projects' ? { kind: 'tabs' } : { kind: 'page' };
        }
      },
      true,
    );
    doc.addEventListener('pointerdown', (e) => {
      const t = e.target as HTMLElement;
      const handle = t.closest<HTMLElement>('[data-act="drag"]');
      const sec = t.closest<HTMLElement>('[data-section]');
      if (handle && sec) {
        e.preventDefault();
        startDrag(doc, Number(sec.dataset.section), e);
      }
    });
    doc.addEventListener('submit', (e) => e.preventDefault(), true);
    doc.addEventListener('input', onInput);
    doc.addEventListener('focusout', (e) => {
      if (editing && e.target === editing.el) stopEdit();
    });
    doc.addEventListener('keydown', (e) => {
      if (editing) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          editing.el.blur();
        }
        return;
      }
      forwardShortcut(e);
    });
    doc.addEventListener('beforeinput', (e) => {
      if (!editing?.max || !e.inputType.startsWith('insert')) return;
      const sel = doc.getSelection();
      const selected = sel && !sel.isCollapsed ? sel.toString().length : 0;
      const add = e.data?.length ?? 1;
      if ((editing.el.textContent ?? '').length - selected + add > editing.max) {
        e.preventDefault();
        ed.say(`Maksimal ${editing.max} karakter untuk field ini.`);
      }
    });
    doc.defaultView?.addEventListener('scroll', updateBadge, { passive: true });
  }

  function forwardShortcut(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? ed.redo() : ed.undo();
    } else if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      ed.redo();
    }
  }

  const widths = { desktop: '100%', tablet: '834px', mobile: '390px' };
  const fieldLabel = (path: string) => {
    const m = path.match(/^page\.sections\.(\d+)\.(.+)$/);
    if (m) return fieldsFor(Number(m[1]), m[2]).label;
    if (path.startsWith('page.')) return fieldsFor(null, path.replace(/^page\.(data\.)?/, 'page.')).label;
    return path;
  };
</script>

<div class="canvas" class:framed={ed.device !== 'desktop'}>
  {#if ed.renderErrors.length}
    <div class="render-errors" role="alert">
      <strong>Tampilan belum diperbarui. Perbaiki dulu:</strong>
      <ul>
        {#each ed.renderErrors.slice(0, 5) as err}
          <li>{err.path ? `${fieldLabel(err.path)}: ` : ''}{err.message}</li>
        {/each}
      </ul>
    </div>
  {/if}
  <iframe bind:this={iframe} title="Kanvas halaman" style:width={widths[ed.device]} onload={onLoad}></iframe>
  {#if !shown && !ed.renderErrors.length}<p class="first" role="status">Menyiapkan pratinjau halaman…</p>{/if}
  {#if ed.rendering}<div class="spinner" aria-hidden="true"></div>{/if}
</div>

<style>
  .canvas {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #e9e9ec;
    overflow: hidden;
  }
  iframe {
    flex: 1;
    border: 0;
    background: #fff;
    max-width: 100%;
    transition: width 0.25s ease;
  }
  .framed iframe {
    margin: 16px 0;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgb(0 0 0 / 0.18);
  }
  .render-errors {
    position: absolute;
    z-index: 5;
    top: 12px;
    left: 50%;
    translate: -50% 0;
    max-width: min(560px, 90%);
    padding: 12px 16px;
    border-radius: 10px;
    background: #fef2f2;
    color: #7f1d1d;
    border: 1px solid #fecaca;
    font-size: 13px;
    box-shadow: 0 6px 20px rgb(0 0 0 / 0.12);
  }
  .render-errors ul {
    margin: 6px 0 0 18px;
    list-style: disc;
  }
  .first {
    position: absolute;
    top: 45%;
    margin: 0;
    color: var(--e-muted);
    font-size: 14px;
  }
  .spinner {
    position: absolute;
    right: 16px;
    bottom: 16px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    border: 2px solid #93c5fd;
    border-top-color: #2563eb;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }
</style>
