import { APIRequestContext } from '@playwright/test';

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
}

/**
 * Sends a POST request and returns the parsed JSON body.
 * Useful for creating test data before a UI test runs.
 */
export async function apiPost<T = unknown>(
  request: APIRequestContext,
  url: string,
  payload: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  const response = await request.post(url, {
    data: payload,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  const body = (await response.json()) as T;
  return { status: response.status(), body };
}

/**
 * Sends a GET request and returns the parsed JSON body.
 */
export async function apiGet<T = unknown>(
  request: APIRequestContext,
  url: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  const response = await request.get(url, { headers });
  const body = (await response.json()) as T;
  return { status: response.status(), body };
}

/**
 * Sends a DELETE request — useful for cleaning up test data after a test.
 */
export async function apiDelete(
  request: APIRequestContext,
  url: string,
  headers?: Record<string, string>
): Promise<number> {
  const response = await request.delete(url, { headers });
  return response.status();
}
