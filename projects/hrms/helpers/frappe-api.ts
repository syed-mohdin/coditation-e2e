/**
 * Frappe REST API helpers for E2E test data setup and teardown.
 *
 * Uses the page's already-authenticated request context (page.request), which
 * carries the session cookie set by the login flow. The CSRF token is read from
 * the browser's cookie jar and injected into every mutating request.
 */
import { Page } from '@playwright/test';

type JsonBody = Record<string, unknown>;

/** Returns the CSRF token from the browser's cookie jar. */
async function csrfToken(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === 'csrf_token')?.value ?? '';
}

/** POST /api/resource/{doctype} — create a document. Returns the created doc name. */
export async function createDoc(
  page: Page,
  doctype: string,
  data: JsonBody
): Promise<string> {
  const csrf = await csrfToken(page);
  const res = await page.request.post(`/api/resource/${encodeURIComponent(doctype)}`, {
    headers: { 'X-Frappe-CSRF-Token': csrf, 'Content-Type': 'application/json' },
    data: JSON.stringify(data),
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`createDoc ${doctype} failed (${res.status()}): ${body.slice(0, 200)}`);
  }
  const body = await res.json() as { data: { name: string } };
  return body.data.name;
}

/** PUT /api/resource/{doctype}/{name} — update a document. */
export async function updateDoc(
  page: Page,
  doctype: string,
  name: string,
  data: JsonBody
): Promise<void> {
  const csrf = await csrfToken(page);
  const res = await page.request.put(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    {
      headers: { 'X-Frappe-CSRF-Token': csrf, 'Content-Type': 'application/json' },
      data: JSON.stringify(data),
    }
  );
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`updateDoc ${doctype}/${name} failed (${res.status()}): ${body.slice(0, 200)}`);
  }
}

/** DELETE /api/resource/{doctype}/{name} — delete a document (must be cancelable or draft). */
export async function deleteDoc(
  page: Page,
  doctype: string,
  name: string
): Promise<void> {
  const csrf = await csrfToken(page);
  const res = await page.request.delete(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { headers: { 'X-Frappe-CSRF-Token': csrf } }
  );
  if (!res.ok() && res.status() !== 404) {
    const body = await res.text();
    throw new Error(`deleteDoc ${doctype}/${name} failed (${res.status()}): ${body.slice(0, 200)}`);
  }
}

/** GET /api/resource/{doctype}/{name} — fetch a single document. */
export async function getDoc(
  page: Page,
  doctype: string,
  name: string,
  fields?: string[]
): Promise<JsonBody> {
  const params = fields ? `?fields=${JSON.stringify(fields)}` : '';
  const res = await page.request.get(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}${params}`
  );
  if (!res.ok()) {
    throw new Error(`getDoc ${doctype}/${name} failed (${res.status()})`);
  }
  const body = await res.json() as { data: JsonBody };
  return body.data;
}

/** GET /api/resource/{doctype} — list documents with optional filters. */
export async function listDocs(
  page: Page,
  doctype: string,
  filters?: JsonBody,
  fields?: string[]
): Promise<JsonBody[]> {
  const params = new URLSearchParams();
  if (filters) params.set('filters', JSON.stringify(filters));
  if (fields) params.set('fields', JSON.stringify(fields));
  const res = await page.request.get(
    `/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`
  );
  if (!res.ok()) {
    throw new Error(`listDocs ${doctype} failed (${res.status()})`);
  }
  const body = await res.json() as { data: JsonBody[] };
  return body.data;
}

/** POST /api/method/frappe.client.submit — submit a document. */
export async function submitDoc(
  page: Page,
  doctype: string,
  name: string
): Promise<void> {
  const csrf = await csrfToken(page);
  const doc = await getDoc(page, doctype, name);
  const res = await page.request.post('/api/method/frappe.client.submit', {
    headers: { 'X-Frappe-CSRF-Token': csrf, 'Content-Type': 'application/json' },
    data: JSON.stringify({ doc: { ...doc, doctype, name } }),
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`submitDoc ${doctype}/${name} failed (${res.status()}): ${body.slice(0, 200)}`);
  }
}

/** POST /api/method/frappe.client.cancel — cancel a submitted document. */
export async function cancelDoc(
  page: Page,
  doctype: string,
  name: string
): Promise<void> {
  const csrf = await csrfToken(page);
  const res = await page.request.post('/api/method/frappe.client.cancel', {
    headers: { 'X-Frappe-CSRF-Token': csrf, 'Content-Type': 'application/json' },
    data: JSON.stringify({ doctype, name }),
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`cancelDoc ${doctype}/${name} failed (${res.status()}): ${body.slice(0, 200)}`);
  }
}

/** POST /api/method/{method} — call a whitelisted Frappe method. */
export async function callMethod(
  page: Page,
  method: string,
  args: JsonBody = {}
): Promise<unknown> {
  const csrf = await csrfToken(page);
  const res = await page.request.post(`/api/method/${method}`, {
    headers: { 'X-Frappe-CSRF-Token': csrf, 'Content-Type': 'application/json' },
    data: JSON.stringify(args),
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`callMethod ${method} failed (${res.status()}): ${body.slice(0, 200)}`);
  }
  const body = await res.json() as { message: unknown };
  return body.message;
}

/** Returns current year as a string. */
export function currentYear(): string {
  return new Date().getFullYear().toString();
}

/** Returns today as YYYY-MM-DD. */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** Returns a date offset by `days` from today, as YYYY-MM-DD. */
export function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
