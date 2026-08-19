'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CheckSquare, CircleDashed, Inbox, LogOut, Plus, Search, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Protected } from '@/components/protected';
import { TaskCard } from '@/components/task-card';
import { TaskForm } from '@/components/task-form';
import { useAuth } from '@/context/auth-context';
import { Task, taskAPI } from '@/lib/api';

const emptyFilters = { search: '', status: '', priority: '', startDate: '', endDate: '', sort: '-createdAt' };

export default function DashboardPage() {
  return (
    <Protected>
      <Dashboard />
    </Protected>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const params = useMemo(
    () => ({ page, limit: 9, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }),
    [filters, page],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => (await taskAPI.list(params)).data,
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });

  const saveMutation = useMutation({
    mutationFn: (fd: FormData) => (editing ? taskAPI.update(editing._id, fd) : taskAPI.create(fd)),
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      const fd = new FormData();
      fd.append('status', status);
      return taskAPI.update(id, fd);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskAPI.remove(id),
    onSuccess: () => {
      setToDelete(null);
      invalidate();
    },
  });

  const tasks: Task[] = data?.data || [];
  const meta = data?.meta || { page: 1, lastPage: 1, total: 0 };
  const stats = data?.stats || { PENDING: 0, IN_PROGRESS: 0, DONE: 0, total: 0 };
  const setFilter = (key: string, value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold">TaskFlow</p>
              <p className="hidden text-[11px] text-slate-500 sm:block">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" /> New task
            </button>
            <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm text-slate-500 hover:bg-slate-100">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Your tasks</h1>
        <p className="mt-1 text-sm text-slate-500">Private to you. Weather follows the city on each card.</p>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'All tasks', value: stats.total, icon: Inbox, dark: true },
            { label: 'Pending', value: stats.PENDING, icon: CircleDashed },
            { label: 'In progress', value: stats.IN_PROGRESS, icon: Timer },
            { label: 'Done', value: stats.DONE, icon: CheckCircle2 },
          ].map((card) => (
            <div key={card.label} className={`rounded-2xl border border-slate-200 p-4 ${card.dark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
              <div className="flex items-center justify-between text-sm opacity-70">
                {card.label} <card.icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-3xl font-extrabold">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Search title, description, or city" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
              <select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="">All priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <input type="date" value={filters.startDate} onChange={(e) => setFilter('startDate', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <input type="date" value={filters.endDate} onChange={(e) => setFilter('endDate', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="-createdAt">Newest</option>
                <option value="dueDate">Due date</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mt-6">
          {isError ? (
            <div className="rounded-3xl border border-rose-200 bg-white px-6 py-16 text-center">
              <h3 className="text-lg font-bold">Couldn’t load your tasks</h3>
              <p className="mt-1 text-sm text-slate-500">{(error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Try again'}</p>
              <button type="button" onClick={() => refetch()} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Retry</button>
            </div>
          ) : isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-lg font-bold">No tasks yet</h3>
              <button type="button" onClick={() => setOpen(true)} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">New task</button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={(t) => { setEditing(t); setOpen(true); }}
                  onDelete={setToDelete}
                  onStatus={(t, status) => statusMutation.mutate({ id: t._id, status })}
                />
              ))}
            </div>
          )}
        </section>

        {meta.lastPage > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl border bg-white px-3 py-2 text-sm disabled:opacity-40">Previous</button>
            <span className="text-sm text-slate-500">Page {meta.page} of {meta.lastPage}</span>
            <button type="button" disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)} className="rounded-xl border bg-white px-3 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </main>

      <TaskForm
        open={open}
        task={editing}
        submitting={saveMutation.isPending}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSubmit={(fd) => saveMutation.mutate(fd)}
      />

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold">Delete this task?</h3>
            <p className="mt-1 text-sm text-slate-500">“{toDelete.title}” will be removed.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setToDelete(null)} className="rounded-xl px-3 py-2 text-sm">Cancel</button>
              <button type="button" onClick={() => deleteMutation.mutate(toDelete._id)} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
