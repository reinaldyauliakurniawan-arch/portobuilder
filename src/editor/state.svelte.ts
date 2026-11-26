import { PATHS, diffFiles, parseFiles, serialize, slugify, uniqueId, type ContentState } from '../lib/content-files';
import { validateContent, removeMenuLinks, type Problem } from '../lib/validate';
import { sample, variantsOf } from '../lib/dev-samples';
import { RESERVED_SLUGS, type SectionType } from '../lib/schemas';
import type { FieldError } from '../lib/preview';
import { blobToBase64, idbClear, idbGet, idbPut, measure, prepareFile } from './media';
import type { Storage } from './storage';

export type PageRef =
  | { kind: 'home' }
  | { kind: 'about' }
  | { kind: 'projects' }
  | { kind: 'custom'; id: string }
  | { kind: 'project'; id: string };

export type Panel = { kind: 'tabs' } | { kind: 'section'; index: number } | { kind: 'page' } | { kind: 'problems' };
export type Tab = 'insert' | 'pages' | 'menu' | 'theme' | 'site';

const DRAFT_KEY = 'pb-editor-draft';
const IMG_RE = /^\/uploads\/.+\.(webp|png|jpe?g|gif|svg)$/i;

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/** Semua string di konten yang menunjuk file di /uploads. */
function uploadRefs(v: unknown, out = new Set<string>()): Set<string> {
  if (typeof v === 'string' && v.startsWith('/uploads/')) out.add(v);
  else if (Array.isArray(v)) v.forEach((x) => uploadRefs(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => uploadRefs(x, out));
  return out;
}

type Draft = { base: string; content: ContentState; uploads: string[] };

class Editor {
  status = $state<'loading' | 'login' | 'ready' | 'error'>('loading');
  error = $state('');
  storage: Storage | null = null;
  content = $state<ContentState | null>(null);
  base = $state<Record<string, string>>({});
  page = $state<PageRef>({ kind: 'home' });
  tab = $state<Tab>('insert');
  panel = $state<Panel>({ kind: 'tabs' });
  /** Posisi sisip section berikutnya (null = paling bawah / setelah section terpilih). */
  insertAt = $state<number | null>(null);
  device = $state<'desktop' | 'tablet' | 'mobile'>('desktop');
  uploads = $state<Record<string, { blob: Blob; url: string }>>({});
  dims = $state<Record<string, { width: number; height: number }>>({});
  renderTick = $state(0);
  renderErrors = $state<FieldError[]>([]);
  rendering = $state(false);
  toast = $state('');
  busy = $state('');
  publishOpen = $state(false);
  staleDraft = $state<Draft | null>(null);
  problems = $state<Problem[]>([]);
  canUndo = $state(false);
  canRedo = $state(false);
  sidebarOpen = $state(true);

  private past: string[] = [];
  private future: string[] = [];
  private lastGroup = '';
  private lastTime = 0;
  private draftTimer: ReturnType<typeof setTimeout> | undefined;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  serialized = $derived(this.content ? serialize(this.content) : {});
  changes = $derived(diffFiles(this.base, this.serialized));
  dirty = $derived(Object.keys(this.changes).length + this.pendingUploadPaths().length);

  // ---------- muat ----------

  async start(storage: Storage) {
    this.storage = storage;
    this.status = 'loading';
    try {
      const files = await storage.load();
      this.base = serialize(parseFiles(files)); // format seragam supaya diff bersih
      this.content = parseFiles(this.base);
      await this.restoreDraft();
      this.status = 'ready';
      this.measureImages();
      this.renderTick++;
    } catch (e) {
      this.status = 'error';
      this.error = (e as Error).message;
    }
  }

  private baseKey() {
    return hash(Object.values(this.base).join('\u0000'));
  }

  private async restoreDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw) as Draft;
      // Draft dari sebelum publikasi terakhir bisa menimpa isi yang lebih baru: tanya dulu (dialog di Editor.svelte).
      if (d.base !== this.baseKey()) this.staleDraft = d;
      else await this.applyDraft(d);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  private async applyDraft(d: Draft) {
    for (const path of d.uploads) {
      const blob = await idbGet(path);
      if (blob) this.uploads[path] = { blob, url: URL.createObjectURL(blob) };
    }
    this.content = d.content;
    if (Object.keys(this.changes).length) this.say('Draft yang belum dipublikasikan dipulihkan.');
  }

  /** Jawaban dialog draft lama: pulihkan atau buang. */
  async resolveStaleDraft(keep: boolean) {
    const d = this.staleDraft;
    this.staleDraft = null;
    if (!d) return;
    if (keep) {
      await this.applyDraft(d);
      this.fixPage();
      this.measureImages();
      this.renderTick++;
    } else {
      localStorage.removeItem(DRAFT_KEY);
      await idbClear();
    }
  }

  private saveDraft() {
    clearTimeout(this.draftTimer);
    this.draftTimer = setTimeout(() => {
      if (!this.content) return;
      if (!this.dirty) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ base: this.baseKey(), content: $state.snapshot(this.content), uploads: Object.keys(this.uploads) }));
    }, 400);
  }

  say(msg: string) {
    this.toast = msg;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = ''), 3500);
  }

  // ---------- perubahan & riwayat ----------

  /** Semua perubahan konten lewat sini: masuk riwayat undo, draft, dan render ulang kanvas. */
  mutate(fn: (c: ContentState) => void, o: { group?: string; render?: boolean } = {}) {
    if (!this.content) return;
    const now = Date.now();
    if (!(o.group && o.group === this.lastGroup && now - this.lastTime < 1500)) {
      this.past.push(JSON.stringify($state.snapshot(this.content)));
      if (this.past.length > 100) this.past.shift();
      this.future = [];
    }
    this.lastGroup = o.group ?? '';
    this.lastTime = now;
    fn(this.content);
    this.afterChange(o.render !== false);
  }

  private afterChange(render = true) {
    this.canUndo = this.past.length > 0;
    this.canRedo = this.future.length > 0;
    if (render) this.renderTick++;
    this.saveDraft();
  }

  undo() {
    const prev = this.past.pop();
    if (!prev || !this.content) return;
    this.future.push(JSON.stringify($state.snapshot(this.content)));
    this.content = JSON.parse(prev);
    this.lastGroup = '';
    this.fixPage();
    this.afterChange();
  }

  redo() {
    const next = this.future.pop();
    if (!next || !this.content) return;
    this.past.push(JSON.stringify($state.snapshot(this.content)));
    this.content = JSON.parse(next);
    this.lastGroup = '';
    this.fixPage();
    this.afterChange();
  }

  /** Batalkan semua perubahan: kembali ke versi terakhir yang disimpan. Masuk riwayat, jadi bisa di-undo. */
  discard() {
    this.mutate(() => (this.content = parseFiles(this.base)));
    this.fixPage();
    this.say('Semua perubahan dibuang. Klik Urungkan untuk mengembalikannya.');
  }

  /** Setelah undo/hapus: pastikan halaman & section terpilih masih ada. */
  private fixPage() {
    const c = this.content!;
    if ((this.page.kind === 'custom' && !c.customPages[this.page.id]) || (this.page.kind === 'project' && !c.projects[this.page.id])) this.openPage({ kind: 'home' });
    if (this.panel.kind === 'section' && !this.sections()?.[this.panel.index]) this.panel = { kind: 'tabs' };
  }

  // ---------- halaman ----------

  pageKey(p: PageRef = this.page) {
    return p.kind === 'custom' || p.kind === 'project' ? `${p.kind}:${p.id}` : p.kind;
  }

  openPage(p: PageRef) {
    this.page = p;
    this.panel = p.kind === 'project' ? { kind: 'page' } : { kind: 'tabs' };
    this.insertAt = null;
    this.renderTick++;
  }

  /** Objek dokumen halaman aktif (yang di-mutate). */
  doc(): any {
    const c = this.content;
    if (!c) return null;
    switch (this.page.kind) {
      case 'home':
        return c.home;
      case 'about':
        return c.about;
      case 'custom':
        return c.customPages[this.page.id];
      case 'project':
        return c.projects[this.page.id];
      default:
        return null;
    }
  }

  sections(): any[] | null {
    const d = this.doc();
    return this.page.kind === 'project' || !d ? null : d.sections;
  }

  pageTitle(p: PageRef = this.page): string {
    const c = this.content;
    if (p.kind === 'home') return 'Beranda';
    if (p.kind === 'about') return 'About';
    if (p.kind === 'projects') return 'Daftar Proyek';
    if (p.kind === 'custom') return c?.customPages[p.id]?.title || p.id;
    return c?.projects[p.id]?.data?.title || p.id;
  }

  pageUrl(p: PageRef = this.page): string {
    const c = this.content;
    if (p.kind === 'home') return '/';
    if (p.kind === 'about') return '/about';
    if (p.kind === 'projects') return '/projects';
    if (p.kind === 'custom') return `/${c?.customPages[p.id]?.slug ?? p.id}`;
    return `/projects/${p.id}`;
  }

  /** Path absolut di ContentState untuk path data-edit dari kanvas. */
  absPath(section: number | null, path: string): string {
    const base = this.page.kind === 'custom' ? `customPages.${this.page.id}` : this.page.kind === 'project' ? `projects.${this.page.id}` : this.page.kind;
    if (path.startsWith('page.')) {
      const rest = path.slice(5);
      return this.page.kind === 'project' ? `${base}.data.${rest}` : `${base}.${rest}`;
    }
    return `${base}.sections.${section}.${path}`;
  }

  // ---------- section ----------

  addSection(type: SectionType) {
    const list = this.sections();
    if (!list) return;
    const at = this.insertAt ?? (this.panel.kind === 'section' ? this.panel.index + 1 : list.length);
    this.mutate(() => list.splice(at, 0, sample(type, variantsOf(type)[0], 'normal')));
    this.insertAt = null;
    this.panel = { kind: 'section', index: at };
    this.say('Section ditambahkan. Klik teksnya di halaman untuk mengubah.');
  }

  moveSection(from: number, to: number) {
    const list = this.sections();
    if (!list || to < 0 || to >= list.length || from === to) return;
    this.mutate(() => {
      const [s] = list.splice(from, 1);
      list.splice(to, 0, s);
    });
    if (this.panel.kind === 'section') this.panel = { kind: 'section', index: to };
  }

  duplicateSection(i: number) {
    const list = this.sections();
    if (!list) return;
    this.mutate(() => list.splice(i + 1, 0, JSON.parse(JSON.stringify($state.snapshot(list[i])))));
    this.panel = { kind: 'section', index: i + 1 };
  }

  toggleSection(i: number) {
    const list = this.sections();
    if (list) this.mutate(() => (list[i].enabled = !list[i].enabled));
  }

  deleteSection(i: number) {
    const list = this.sections();
    if (!list) return;
    if (this.page.kind === 'custom' && list.length === 1) return this.say('Halaman custom minimal punya 1 section.');
    this.mutate(() => list.splice(i, 1));
    this.panel = { kind: 'tabs' };
    this.say('Section dihapus. Tekan Urungkan (Ctrl+Z) untuk mengembalikan.');
  }

  // ---------- halaman custom & proyek ----------

  private takenSlugs(exceptId?: string) {
    return [...RESERVED_SLUGS, ...Object.entries(this.content!.customPages).filter(([id]) => id !== exceptId).map(([, p]) => p.slug as string)];
  }

  addCustomPage(title: string) {
    const c = this.content!;
    const slug = uniqueId(slugify(title) || 'halaman', this.takenSlugs());
    const id = uniqueId(slug, Object.keys(c.customPages));
    this.mutate(() => {
      c.customPages[id] = {
        title,
        slug,
        pageHeader: { enabled: true, eyebrow: '', subtitle: 'Tulis pengantar singkat halaman ini.', image: '', imageAlt: '', edgeIntensity: 'medium' },
        sections: [sample('richText', 'narrow', 'normal')],
        seo: { description: '', ogImage: '', noindex: false },
        draft: false,
      };
    });
    this.openPage({ kind: 'custom', id });
    this.say(`Halaman "${title}" dibuat di /${slug}. Tambahkan section dari tab Sisipkan.`);
  }

  duplicateCustomPage(id: string) {
    const c = this.content!;
    const src = $state.snapshot(c.customPages[id]) as any;
    const slug = uniqueId(`${src.slug}-salinan`, this.takenSlugs());
    const nid = uniqueId(slug, Object.keys(c.customPages));
    this.mutate(() => (c.customPages[nid] = { ...src, title: `${src.title} (salinan)`, slug, draft: true }));
    this.openPage({ kind: 'custom', id: nid });
  }

  deleteCustomPage(id: string) {
    const c = this.content!;
    const slug = c.customPages[id]?.slug;
    this.mutate(() => {
      delete c.customPages[id];
      c.navigation = removeMenuLinks(c.navigation, slug);
    });
    this.openPage({ kind: 'home' });
    this.say('Halaman dihapus dan link-nya dikeluarkan dari menu.');
  }

  setDraft(id: string, draft: boolean) {
    const c = this.content!;
    this.mutate(() => {
      c.customPages[id].draft = draft;
      if (draft) c.navigation = removeMenuLinks(c.navigation, c.customPages[id].slug);
    });
    if (draft) this.say('Halaman disembunyikan dan dikeluarkan dari menu.');
  }

  /** Ganti alamat halaman custom; link menu & tombol ikut diperbarui. */
  renameSlug(id: string, raw: string) {
    const c = this.content!;
    const old = c.customPages[id].slug;
    const slug = slugify(raw);
    if (!slug) return this.say('Alamat hanya boleh huruf kecil, angka, dan tanda hubung.');
    if (this.takenSlugs(id).includes(slug)) return this.say(`Alamat /${slug} sudah dipakai atau dicadangkan sistem.`);
    this.mutate(() => {
      c.customPages[id].slug = slug;
      const fix = (v: any): void => {
        if (Array.isArray(v)) v.forEach(fix);
        else if (v && typeof v === 'object') {
          if (v.linkType === 'custom' && v.customPage === old) v.customPage = slug;
          Object.values(v).forEach(fix);
        }
      };
      fix(c);
    });
  }

  inMenu(slug: string) {
    return !!this.content?.navigation.mainMenu?.some((m: any) => m.linkType === 'custom' && m.customPage === slug);
  }

  toggleMenu(id: string) {
    const c = this.content!;
    const p = c.customPages[id];
    if (this.inMenu(p.slug)) {
      this.mutate(() => (c.navigation.mainMenu = c.navigation.mainMenu.filter((m: any) => !(m.linkType === 'custom' && m.customPage === p.slug))));
      return;
    }
    if (p.draft) return this.say('Halaman draft tidak bisa masuk menu. Terbitkan dulu halamannya.');
    if ((c.navigation.mainMenu?.length ?? 0) >= 6) return this.say('Menu navbar sudah 6 item (maksimum). Keluarkan satu item dulu.');
    this.mutate(() => c.navigation.mainMenu.push({ label: p.title.slice(0, 30), linkType: 'custom', customPage: p.slug, openNewTab: false }));
  }

  addProject() {
    const c = this.content!;
    const id = uniqueId('proyek-baru', Object.keys(c.projects));
    this.mutate(() => {
      c.projects[id] = {
        data: {
          title: 'Proyek baru',
          category: 'Branding',
          year: new Date().getFullYear(),
          cover: '/uploads/sample/project-1.webp',
          coverAlt: 'Cover proyek baru',
          summary: 'Ringkasan singkat proyek ini, tampil di kartu proyek.',
          role: '',
          client: '',
          tools: [],
          featured: false,
          gallery: [],
          videos: [],
          externalUrl: '',
          draft: true,
        },
        body: '## Masalah\n\nCeritakan masalahnya.\n\n## Proses\n\nCeritakan prosesnya.\n\n## Hasil\n\nCeritakan hasilnya.',
      };
    });
    this.openPage({ kind: 'project', id });
    this.say('Proyek baru dibuat sebagai draft. Matikan "Sembunyikan (draft)" kalau sudah siap tampil.');
  }

  deleteProject(id: string) {
    const c = this.content!;
    this.mutate(() => delete c.projects[id]);
    this.openPage({ kind: 'projects' });
    this.say('Proyek dihapus.');
  }

  // ---------- media ----------

  async upload(file: File): Promise<string | null> {
    try {
      if (file.type === 'video/mp4' && file.size > 10 * 1024 * 1024) throw new Error('Video maksimal 10 MB.');
      if (file.size > 25 * 1024 * 1024) throw new Error('File terlalu besar (maks. 25 MB).');
      this.busy = 'Memproses file…';
      const p = await prepareFile(file);
      const name = slugify(file.name.replace(/\.[^.]+$/, '')) || 'file';
      const path = `/uploads/${name}-${Math.random().toString(36).slice(2, 6)}.${p.ext}`;
      this.uploads[path] = { blob: p.blob, url: URL.createObjectURL(p.blob) };
      if (p.width) this.dims[path] = { width: p.width, height: p.height };
      await idbPut(path, p.blob).catch(() => {});
      return path;
    } catch (e) {
      this.say((e as Error).message);
      return null;
    } finally {
      this.busy = '';
    }
  }

  /** URL untuk menampilkan file: blob bila belum dipublikasikan. */
  mediaUrl(path: string) {
    return this.uploads[path]?.url ?? path;
  }

  private pendingUploadPaths() {
    if (!this.content) return [];
    const refs = uploadRefs(this.content);
    return Object.keys(this.uploads).filter((p) => refs.has(p) && !Object.values(this.base).some((f) => f.includes(p)));
  }

  /** Ukur gambar yang belum diketahui dimensinya (dipakai kanvas untuk layout & masonry). */
  async measureImages() {
    if (!this.content) return;
    const todo = [...uploadRefs(this.content)].filter((p) => IMG_RE.test(p) && !this.dims[p]);
    if (!todo.length) return;
    await Promise.all(todo.map((p) => measure(this.mediaUrl(p)).then((d) => (this.dims[p] = d)).catch(() => {})));
    this.renderTick++;
  }

  // ---------- payload kanvas ----------

  payload() {
    const c = $state.snapshot(this.content!) as ContentState;
    const ctx = {
      site: c.site,
      home: c.home,
      theme: c.theme,
      navigation: c.navigation,
      customPages: Object.values(c.customPages).map((p) => ({ slug: p.slug, title: p.title, draft: !!p.draft })),
      projects: Object.entries(c.projects).map(([id, p]) => ({ id, data: p.data })),
      assets: $state.snapshot(this.dims),
    };
    const p = this.page;
    if (p.kind === 'home') return { ...ctx, kind: 'home', page: c.home };
    if (p.kind === 'about') return { ...ctx, kind: 'about', page: c.about };
    if (p.kind === 'custom') return { ...ctx, kind: 'custom', page: c.customPages[p.id] };
    if (p.kind === 'project') return { ...ctx, kind: 'project', project: { id: p.id, ...c.projects[p.id] } };
    return { ...ctx, kind: 'projects' };
  }

  // ---------- publish ----------

  /** Nama manusiawi untuk path file yang berubah. */
  describe(path: string) {
    const c = this.content!;
    if (path === PATHS.site) return 'Pengaturan situs';
    if (path === PATHS.theme) return 'Tema';
    if (path === PATHS.navigation) return 'Menu navigasi';
    if (path === PATHS.home) return 'Beranda';
    if (path === PATHS.about) return 'About';
    const custom = path.match(/custom-pages\/(.+)\.json$/);
    if (custom) return `Halaman: ${c.customPages[custom[1]]?.title ?? `${custom[1]} (dihapus)`}`;
    const proj = path.match(/projects\/(.+)\.md$/);
    if (proj) return `Proyek: ${c.projects[proj[1]]?.data?.title ?? `${proj[1]} (dihapus)`}`;
    return path;
  }

  openPublish() {
    this.problems = validateContent($state.snapshot(this.content!) as ContentState);
    this.publishOpen = true;
  }

  async publish() {
    if (!this.storage || !this.content) return;
    this.problems = validateContent($state.snapshot(this.content) as ContentState);
    if (this.problems.length) return;
    this.busy = 'Mempublikasikan…';
    try {
      const changes = $state.snapshot(this.changes) as Record<string, string | null>;
      const uploads: Record<string, string> = {};
      for (const p of this.pendingUploadPaths()) uploads[`public${p}`] = await blobToBase64(this.uploads[p].blob);
      const names = [...new Set(Object.keys(changes).map((p) => this.describe(p)))];
      const message = `Editor: ${names.slice(0, 4).join(', ')}${names.length > 4 ? ` +${names.length - 4}` : ''}${Object.keys(uploads).length ? ` (+${Object.keys(uploads).length} file)` : ''}`;
      await this.storage.save(changes, uploads, message);
      this.base = $state.snapshot(this.serialized) as Record<string, string>;
      // Upload kini ada di repo; blob URL tetap dipakai sampai halaman dimuat ulang.
      for (const p of Object.keys(uploads)) this.base[`__upload:${p}`] = p;
      localStorage.removeItem(DRAFT_KEY);
      await idbClear().catch(() => {});
      this.publishOpen = false;
      this.say(this.storage.kind === 'github' ? 'Terpublikasi. Situs diperbarui dalam 1–3 menit.' : 'Tersimpan ke file. Jalankan npm run build untuk portobuilder.test.');
    } catch (e) {
      this.say((e as Error).message);
    } finally {
      this.busy = '';
    }
  }
}

export const ed = new Editor();
