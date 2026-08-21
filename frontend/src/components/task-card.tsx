'use client';

import { Calendar, MapPin, MoreHorizontal, Paperclip, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Task } from '@/lib/api';
import { WeatherBadge } from './weather-badge';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  DONE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const priorityStyles: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-orange-50 text-orange-700',
  HIGH: 'bg-rose-50 text-rose-700',
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatus,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatus: (task: Task, status: Task['status']) => void;
}) {
  const [open, setOpen] = useState(false);
  const overdue = Boolean(
    task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date(),
  );

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ring-1 ${statusStyles[task.status]}`}
          >
            {task.status.replace('_', ' ')}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityStyles[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {open && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onEdit(task);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onDelete(task);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <h3 className="mb-1.5 text-base font-semibold text-slate-900">{task.title}</h3>
      <p className="mb-4 line-clamp-2 text-sm text-slate-500">
        {task.description || 'No description'}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${overdue ? 'bg-rose-50 font-medium text-rose-600' : 'bg-slate-100'}`}
          >
            <Calendar className="h-3.5 w-3.5" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.location && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
            <MapPin className="h-3.5 w-3.5 text-rose-500" />
            {task.location}
          </span>
        )}
        <WeatherBadge weather={task.weather} location={task.location} />
        {task.fileUrl && (
          <a
            href={task.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-600"
          >
            <Paperclip className="h-3.5 w-3.5" />
            {task.fileName || 'Attachment'}
          </a>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-3">
        {(['PENDING', 'IN_PROGRESS', 'DONE'] as const).map((status) => (
          <button
            key={status}
            type="button"
            disabled={task.status === status}
            onClick={() => onStatus(task, status)}
            className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${task.status === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            {status === 'IN_PROGRESS' ? 'Doing' : status === 'PENDING' ? 'Todo' : 'Done'}
          </button>
        ))}
      </div>
    </article>
  );
}
