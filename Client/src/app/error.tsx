'use client';
import { ErrorState } from '@/components/ui';
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <ErrorState retry={reset} />; }
