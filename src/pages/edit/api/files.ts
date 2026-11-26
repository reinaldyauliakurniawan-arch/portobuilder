// Mode lokal editor visual: baca/tulis file konten langsung di disk.
// Hanya aktif di `npm run dev`; di build produksi selalu 404 (editor memakai GitHub).
import type { APIRoute } from 'astro';
import { readContentFiles, writeChanges } from '../../../lib/local-files';

export const prerender = false;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const allowed = (request: Request) => import.meta.env.DEV && request.headers.get('x-portobuilder-preview') === '1';

export const GET: APIRoute = async ({ request }) => {
  if (!allowed(request)) return new Response('Not found', { status: 404 });
  return json({ files: await readContentFiles() });
};

export const POST: APIRoute = async ({ request }) => {
  if (!allowed(request)) return new Response('Not found', { status: 404 });
  try {
    const { changes = {}, uploads = {} } = (await request.json()) as { changes?: Record<string, string | null>; uploads?: Record<string, string> };
    await writeChanges(changes, uploads);
    return json({ ok: true, files: await readContentFiles() });
  } catch (e) {
    return json({ ok: false, message: (e as Error).message }, 400);
  }
};
