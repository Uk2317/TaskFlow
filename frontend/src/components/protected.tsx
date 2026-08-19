'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getAuthToken } from '@/lib/api';

export function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const hasToken = typeof window !== 'undefined' && Boolean(getAuthToken());

  useEffect(() => {
    if (!loading && !isAuthenticated && !hasToken) router.replace('/login');
  }, [loading, isAuthenticated, hasToken, router]);

  if (loading || (hasToken && !isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
