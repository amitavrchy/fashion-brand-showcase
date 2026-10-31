export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...options, credentials: 'same-origin',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(Array.isArray(data.message) ? data.message.join('. ') : data.message ?? 'Something went wrong. Please try again.', response.status);
  }
  return response.json();
}
export const money = (value: string | number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value));
export const message = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
