// End-to-end API smoke test (admin flow). Usage: SMOKE_PASSWORD=... node scripts/smoke-api.mjs <apiUrl> [uploadsDir]
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const API = process.argv[2] || 'http://localhost:3001';
const UPLOADS_DIR = process.argv[3];
const ADMIN_EMAIL = process.env.SMOKE_EMAIL || 'admin@adverse.com';
const ADMIN_PASSWORD = process.env.SMOKE_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('SMOKE_PASSWORD env var is required');
  process.exit(2);
}

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

let token = '';
let failures = 0;
const check = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`);
};

async function req(method, path, { body, form, auth = true, expect } = {}) {
  const headers = {};
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(API + path, { method, headers, body: payload });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (expect !== undefined) {
    check(
      res.status === expect,
      `${method} ${path} -> ${res.status}${res.status === expect ? '' : ` (expected ${expect}) ${JSON.stringify(data).slice(0, 200)}`}`,
    );
  }
  return { status: res.status, data, headers: res.headers };
}

const fileForm = (field, files) => {
  const form = new FormData();
  for (const [name, buf, type] of files) form.append(field, new Blob([buf], { type }), name);
  return form;
};

const fileOnDisk = (fileUrl) => (UPLOADS_DIR ? existsSync(join(UPLOADS_DIR, basename(fileUrl))) : null);

const ts = Date.now();
let clientId, batchId, accessToken, c1, c2;

try {
  // Health
  const health = await req('GET', '/health', { auth: false, expect: 200 });
  check(health.data?.database === 'connected', 'database connected');

  // Auth
  await req('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: 'senha-errada' }, auth: false, expect: 401 });
  const login = await req('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, auth: false, expect: 201 });
  token = login.data?.access_token || '';
  check(!!token && !('passwordHash' in (login.data?.user || {})), 'login returns token and public user');
  const me = await req('GET', '/auth/me', { expect: 200 });
  check(me.data?.email === ADMIN_EMAIL, 'GET /auth/me returns the logged user');
  await req('PATCH', '/auth/password', { body: { currentPassword: 'senha-errada', newPassword: 'nova-senha-123' }, expect: 400 });
  await req('GET', '/users', { expect: 200 });
  await req('GET', '/batches', { auth: false, expect: 401 });

  // Client + batch
  const client = await req('POST', '/clients', { body: { name: `Smoke Client ${ts}`, email: 'smoke@example.com' }, expect: 201 });
  clientId = client.data?.id;
  const batch = await req('POST', '/batches', { body: { name: `Smoke Lote ${ts}`, clientId }, expect: 201 });
  batchId = batch.data?.id;
  accessToken = batch.data?.accessToken;
  check(!!batchId && !!accessToken, 'batch created with access token');

  // Upload (accented filename + plain) and media filter
  const upload = await req('POST', `/creatives/batch/${batchId}`, {
    form: fileForm('files', [['Criação Teste.png', PNG, 'image/png'], ['banner-2.png', PNG, 'image/png']]),
    expect: 201,
  });
  [c1, c2] = upload.data || [];
  check(upload.data?.length === 2, 'two creatives created');
  check(c1?.name === 'Criação Teste.png', `accented filename preserved (got "${c1?.name}")`);
  check(typeof c1?.fileUrl === 'string' && c1.fileUrl.startsWith('/uploads/'), `local fileUrl (${c1?.fileUrl})`);
  check(fileOnDisk(c1?.fileUrl) !== false, 'uploaded file exists on disk');
  const served = await fetch(API + c1.fileUrl);
  check(served.status === 200 && (served.headers.get('content-type') || '').includes('image/png'), 'uploaded file is served at /uploads');
  await req('POST', `/creatives/batch/${batchId}`, { form: fileForm('files', [['notas.txt', Buffer.from('x'), 'text/plain']]), expect: 400 });
  await req('POST', `/creatives/batch/00000000-0000-4000-8000-000000000000`, { form: fileForm('files', [['x.png', PNG, 'image/png']]), expect: 404 });

  // Public client flow
  const pub = await req('GET', `/public/batch/${accessToken}`, { auth: false, expect: 200 });
  check(pub.data?.creatives?.length === 2 && pub.data?.allCreativesCount === 2, 'public batch lists 2 pending creatives');
  await req('POST', `/public/batch/${accessToken}/approve`, { body: { creativeId: c1.id }, auth: false, expect: 201 });
  await req('POST', `/public/batch/${accessToken}/approve`, { body: { creativeId: c1.id }, auth: false, expect: 400 });
  await req('POST', `/public/batch/${accessToken}/reject`, { body: { creativeId: c2.id, feedback: 'Trocar a cor do fundo' }, auth: false, expect: 201 });

  const completed = await req('GET', `/batches/${batchId}`, { expect: 200 });
  check(
    completed.data?.status === 'COMPLETED' && completed.data?.approvedCount === 1 && completed.data?.rejectedCount === 1,
    `batch COMPLETED with 1/1 (got ${completed.data?.status} ${completed.data?.approvedCount}/${completed.data?.rejectedCount})`,
  );

  // Internal adjustments, rename, validation
  await req('PATCH', `/creatives/${c2.id}/adjustment-status`, { body: { status: 'IN_PROGRESS' }, expect: 200 });
  await req('PATCH', `/creatives/${c2.id}/adjustment-status`, { body: { status: 'FOO' }, expect: 400 });
  await req('PATCH', `/creatives/${c2.id}/name`, { body: { name: 'Banner renomeado' }, expect: 200 });
  await req('PATCH', `/creatives/${c2.id}/name`, { body: { name: '   ' }, expect: 400 });
  await req('PATCH', `/creatives/not-a-uuid/name`, { body: { name: 'x' }, expect: 400 });

  // Revision only on rejected creatives
  await req('POST', `/creatives/${c1.id}/revision`, { form: fileForm('file', [['v2.png', PNG, 'image/png']]), expect: 400 });
  const revision = await req('POST', `/creatives/${c2.id}/revision`, { form: fileForm('file', [['v2.png', PNG, 'image/png']]), expect: 201 });
  check(
    revision.data?.currentVersion === 2 && revision.data?.approval?.status === 'PENDING' && revision.data?.adjustmentStatus?.status === 'RESENT',
    'revision bumps version, resets approval to PENDING and marks RESENT',
  );
  const c2v1Url = c2.fileUrl;
  const c2v2Url = revision.data?.fileUrl;
  const partial = await req('GET', `/batches/${batchId}`, { expect: 200 });
  check(partial.data?.status === 'PARTIAL', `batch back to PARTIAL after revision (got ${partial.data?.status})`);
  const pub2 = await req('GET', `/public/batch/${accessToken}`, { auth: false, expect: 200 });
  check(pub2.data?.creatives?.length === 1 && pub2.data?.allCreativesCount === 2, 'public batch shows only the re-sent creative');

  // Activity logs
  const history = await req('GET', '/activity-logs?limit=5', { expect: 200 });
  check(Array.isArray(history.data) && history.data.length > 0 && !!history.data[0]?.batch?.name, 'global history returns entries with batch info');
  await req('GET', '/activity-logs?before=not-a-date', { expect: 400 });
  const timeline = await req('GET', `/activity-logs/creative/${c2.id}`, { expect: 200 });
  const actions = new Set((timeline.data || []).map((l) => l.action));
  check(
    ['CREATIVE_REJECTED', 'ADJUSTMENT_STATUS_UPDATED', 'CREATIVE_RENAMED', 'REVISION_UPLOADED'].every((a) => actions.has(a)),
    `creative timeline has the expected actions (${[...actions].join(', ')})`,
  );
  await req('GET', `/activity-logs/batch/${batchId}`, { expect: 200 });

  // Deletion removes files
  await req('DELETE', `/creatives/${c1.id}`, { expect: 200 });
  check(fileOnDisk(c1.fileUrl) !== true, 'deleting a creative removes its file');
  const afterDelete = await req('GET', `/batches/${batchId}`, { expect: 200 });
  check(afterDelete.data?.totalCreatives === 1, 'batch counters updated after creative deletion');
  await req('DELETE', `/batches/${batchId}`, { expect: 200 });
  check(fileOnDisk(c2v1Url) !== true && fileOnDisk(c2v2Url) !== true, 'deleting a batch removes all version files');
  await req('GET', `/batches/${batchId}`, { expect: 404 });
  await req('GET', `/public/batch/${accessToken}`, { auth: false, expect: 404 });
  batchId = undefined;
} catch (err) {
  failures++;
  console.log('FAIL unexpected error:', err);
} finally {
  // Cleanup
  if (batchId) await req('DELETE', `/batches/${batchId}`).catch(() => {});
  if (clientId) await req('DELETE', `/clients/${clientId}`, { expect: 200 });
}

console.log(failures === 0 ? '\nSMOKE OK' : `\nSMOKE FAILED (${failures} failures)`);
process.exit(failures === 0 ? 0 : 1);
