// Penyimpanan editor: lokal (npm run dev, tulis file langsung) atau GitHub (produksi, 1 commit per publish).
import { isWritableContent } from '../lib/content-files';

export interface Storage {
  kind: 'local' | 'github';
  load(): Promise<Record<string, string>>;
  /** changes: path -> isi baru (null = hapus). uploads: path -> base64. */
  save(changes: Record<string, string | null>, uploads: Record<string, string>, message: string): Promise<void>;
}

const HDR = { 'x-portobuilder-preview': '1' };

/** Mode lokal tersedia bila endpoint dev merespons (hanya di `npm run dev`). */
export async function tryLocal(): Promise<Storage | null> {
  try {
    const r = await fetch('/edit/api/files', { headers: HDR });
    if (!r.ok) return null;
    const first = ((await r.json()) as { files: Record<string, string> }).files;
    let cached: Record<string, string> | null = first;
    return {
      kind: 'local',
      async load() {
        if (cached) {
          const c = cached;
          cached = null;
          return c;
        }
        const res = await fetch('/edit/api/files', { headers: HDR });
        return ((await res.json()) as { files: Record<string, string> }).files;
      },
      async save(changes, uploads) {
        const res = await fetch('/edit/api/files', { method: 'POST', headers: { ...HDR, 'content-type': 'application/json' }, body: JSON.stringify({ changes, uploads }) });
        const body = (await res.json()) as { ok: boolean; message?: string };
        if (!body.ok) throw new Error(body.message ?? 'Gagal menyimpan file');
      },
    };
  } catch {
    return null;
  }
}

// ---------- GitHub ----------

const TOKEN_KEY = 'pb-github-token';
export const savedToken = () => sessionStorage.getItem(TOKEN_KEY);
export const forgetToken = () => sessionStorage.removeItem(TOKEN_KEY);

/**
 * Login GitHub lewat OAuth provider Netlify (sama dengan Decap/Sveltia): popup api.netlify.com,
 * handshake "authorizing:github", lalu pesan "authorization:github:success:{token}".
 */
export function loginWithNetlify(): Promise<string> {
  const origin = 'https://api.netlify.com';
  const url = `${origin}/auth?provider=github&site_id=${encodeURIComponent(location.hostname)}&scope=repo`;
  const popup = window.open(url, 'netlify-auth', 'width=960,height=640');
  if (!popup) return Promise.reject(new Error('Popup login diblokir browser. Izinkan popup untuk situs ini.'));
  return new Promise((resolve, reject) => {
    const onAuth = (e: MessageEvent) => {
      if (e.origin !== origin || typeof e.data !== 'string') return;
      const ok = e.data.match(/^authorization:github:success:(.+)$/);
      const err = e.data.match(/^authorization:github:error:(.+)$/);
      if (!ok && !err) return;
      window.removeEventListener('message', onAuth);
      popup.close();
      if (err) return reject(new Error('Login GitHub gagal. Pastikan akun Anda punya akses ke repo.'));
      const token = (JSON.parse(ok![1]) as { token: string }).token;
      sessionStorage.setItem(TOKEN_KEY, token);
      resolve(token);
    };
    const onHandshake = (e: MessageEvent) => {
      if (e.origin !== origin || e.data !== 'authorizing:github') return;
      window.removeEventListener('message', onHandshake);
      window.addEventListener('message', onAuth);
      popup.postMessage(e.data, e.origin);
    };
    window.addEventListener('message', onHandshake);
  });
}

function decodeBase64Utf8(b64: string) {
  const bin = atob(b64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function githubStorage(token: string, repo: string, branch: string): Storage {
  const api = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', ...init.headers },
    });
    if (res.status === 401) {
      forgetToken();
      throw new Error('Sesi GitHub berakhir. Muat ulang halaman lalu login lagi.');
    }
    if (!res.ok) throw Object.assign(new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`), { status: res.status });
    return res.json() as Promise<T>;
  };

  type Tree = { tree: { path: string; sha: string; type: string }[] };
  let baseCommit = '';
  let baseBlobs: Record<string, string> = {};

  const contentBlobs = (t: Tree) => Object.fromEntries(t.tree.filter((e) => e.type === 'blob' && isWritableContent(e.path)).map((e) => [e.path, e.sha]));

  return {
    kind: 'github',
    async load() {
      const ref = await api<{ object: { sha: string } }>(`/git/ref/heads/${branch}`);
      baseCommit = ref.object.sha;
      baseBlobs = contentBlobs(await api<Tree>(`/git/trees/${baseCommit}?recursive=1`));
      const files: Record<string, string> = {};
      await Promise.all(
        Object.entries(baseBlobs).map(async ([path, sha]) => {
          const blob = await api<{ content: string }>(`/git/blobs/${sha}`);
          files[path] = decodeBase64Utf8(blob.content);
        }),
      );
      return files;
    },
    async save(changes, uploads, message) {
      const ref = await api<{ object: { sha: string } }>(`/git/ref/heads/${branch}`);
      const head = ref.object.sha;
      if (head !== baseCommit) {
        // Ada commit lain sejak dimuat: tolak bila menyentuh file yang sama.
        const now = contentBlobs(await api<Tree>(`/git/trees/${head}?recursive=1`));
        const clash = Object.keys(changes).filter((p) => now[p] !== baseBlobs[p]);
        if (clash.length) throw new Error(`Ada perubahan lain di ${clash.join(', ')} sejak editor dibuka. Salin perubahan Anda, lalu muat ulang editor.`);
      }
      const headCommit = await api<{ tree: { sha: string } }>(`/git/commits/${head}`);
      const entries: { path: string; mode: '100644'; type: 'blob'; sha: string | null }[] = [];
      for (const [path, b64] of Object.entries(uploads)) {
        const b = await api<{ sha: string }>('/git/blobs', { method: 'POST', body: JSON.stringify({ content: b64, encoding: 'base64' }) });
        entries.push({ path, mode: '100644', type: 'blob', sha: b.sha });
      }
      for (const [path, content] of Object.entries(changes)) {
        if (content === null) {
          entries.push({ path, mode: '100644', type: 'blob', sha: null });
          continue;
        }
        const b = await api<{ sha: string }>('/git/blobs', { method: 'POST', body: JSON.stringify({ content, encoding: 'utf-8' }) });
        entries.push({ path, mode: '100644', type: 'blob', sha: b.sha });
      }
      const tree = await api<{ sha: string }>('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: entries }) });
      const commit = await api<{ sha: string }>('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: tree.sha, parents: [head] }) });
      await api(`/git/refs/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
      baseCommit = commit.sha;
      for (const e of entries) {
        if (!isWritableContent(e.path)) continue;
        if (e.sha) baseBlobs[e.path] = e.sha;
        else delete baseBlobs[e.path];
      }
    },
  };
}
