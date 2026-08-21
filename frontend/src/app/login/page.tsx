'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRight, CheckSquare, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.replace('/dashboard');
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <CheckSquare className="h-5 w-5" />
          </div>
          <span className="text-lg font-extrabold">TaskFlow</span>
        </div>
        <h1 className="text-2xl font-extrabold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Your tasks stay private to this account.</p>
        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <label className="block text-sm font-medium">
            Email
            <span className="relative mt-1.5 block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </span>
          </label>
          <label className="block text-sm font-medium">
            Password
            <span className="relative mt-1.5 block">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link href="/register" className="font-semibold text-indigo-600">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
