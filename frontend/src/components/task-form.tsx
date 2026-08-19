'use client';

import { Paperclip, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Task } from '@/lib/api';

const empty = { title: '', description: '', status: 'PENDING', priority: 'MEDIUM', dueDate: '', location: '' };

export function TaskForm({
  open,
  task,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  task: Task | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (fd: FormData) => void;
}) {
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        location: task.location || '',
      });
    } else setForm(empty);
  }, [open, task]);

  if (!open) return null;

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('file', file);
    onSubmit(fd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close" />
      <form onSubmit={handleSubmit} className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">{task ? 'Edit task' : 'New task'}</h2>
            <p className="text-sm text-slate-500">Location drives live weather. Attach a file if needed.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block text-sm font-medium">
            Title
            <input required value={form.title} onChange={update('title')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea rows={3} value={form.description} onChange={update('description')} className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Status
              <select value={form.status} onChange={update('status')} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Priority
              <select value={form.priority} onChange={update('priority')} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Due date
              <input type="date" value={form.dueDate} onChange={update('dueDate')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5" />
            </label>
            <label className="block text-sm font-medium">
              Location
              <input value={form.location} onChange={update('location')} placeholder="City for weather" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5" />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Attachment
            <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3">
              <Paperclip className="h-4 w-4 text-slate-400" />
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </span>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
