import 'server-only';
export async function publicData<T>(path: string): Promise<T | null> {
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  const response = await fetch(`${base}/${path}`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(5000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('The atelier is temporarily unavailable. Please try again.');
  return response.json();
}
