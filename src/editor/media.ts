// Gambar di browser: kompres ke WebP (maks. 2400 px), ukur dimensi, konversi base64. Plus IndexedDB untuk draft.

export interface Prepared {
  blob: Blob;
  width: number;
  height: number;
  ext: string;
}

const MAX = 2400;

export function measure(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1600, height: img.naturalHeight || 1200 });
    img.onerror = () => reject(new Error(`Gambar tidak bisa dimuat: ${url}`));
    img.src = url;
  });
}

/** Foto dikompres ke WebP; SVG, GIF (animasi), PDF, MP4 disimpan apa adanya. */
export async function prepareFile(file: File): Promise<Prepared> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!file.type.startsWith('image/') || ['svg', 'gif'].includes(ext)) {
    let dims = { width: 0, height: 0 };
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      dims = await measure(url).finally(() => URL.revokeObjectURL(url));
    }
    return { blob: file, ...dims, ext: ext === 'jpeg' ? 'jpg' : ext };
  }
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
  const width = Math.round(bmp.width * scale);
  const height = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Gagal mengompres gambar'))), 'image/webp', 0.85));
  return { blob, width, height, ext: 'webp' };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

// ---------- IndexedDB: file upload yang belum dipublikasikan ----------

const DB = 'portobuilder-editor';
const STORE = 'uploads';

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const idbPut = (path: string, blob: Blob) => tx('readwrite', (s) => s.put(blob, path));
export const idbGet = (path: string) => tx<Blob | undefined>('readonly', (s) => s.get(path));
export const idbClear = () => tx('readwrite', (s) => s.clear());
