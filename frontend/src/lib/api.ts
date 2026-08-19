import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 20000,
});

const TOKEN_KEY = 'taskflow_token';
const USER_KEY = 'taskflow_user';

const safeGet = (storage: Storage, key: string) => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (storage: Storage, key: string, value: string | null) => {
  try {
    if (value == null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

export type AuthUser = { _id: string; name: string; email: string };
export type Weather = { temp: number; description: string; icon: string | null; cityName: string };
export type Task = {
  _id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  location?: string;
  fileUrl?: string;
  fileName?: string;
  weather?: Weather | null;
  createdAt?: string;
};

const readToken = () =>
  (typeof window !== 'undefined' ? window.__TASKFLOW_TOKEN__ : null) ||
  (typeof window !== 'undefined' ? safeGet(localStorage, TOKEN_KEY) || safeGet(sessionStorage, TOKEN_KEY) : null);

export const getAuthToken = () => readToken();

export const persistSession = (data: { token?: string; user?: AuthUser | null }) => {
  if (typeof window !== 'undefined') window.__TASKFLOW_TOKEN__ = data.token || null;
  safeSet(localStorage, TOKEN_KEY, data.token || null);
  safeSet(sessionStorage, TOKEN_KEY, data.token || null);
  safeSet(localStorage, USER_KEY, data.user ? JSON.stringify(data.user) : null);
  safeSet(sessionStorage, USER_KEY, data.user ? JSON.stringify(data.user) : null);
};

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = safeGet(localStorage, USER_KEY) || safeGet(sessionStorage, USER_KEY);
  try {
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => persistSession({ token: undefined, user: null });

const withToken = (url: string) => {
  const token = getAuthToken();
  if (!token) return url;
  return `${url}${url.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`;
};

API.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    const headers = config.headers;
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('X-Access-Token', token);
    headers.set('X-Taskflow-Token', token);
  }
  return config;
});

export const authAPI = {
  login: (payload: { email: string; password: string }) => API.post('/auth/login', payload),
  register: (payload: { name: string; email: string; password: string }) => API.post('/auth/register', payload),
  me: () => API.get(withToken('/auth/me')),
};

export const taskAPI = {
  list: (params: Record<string, string | number | undefined>) => API.get(withToken('/tasks'), { params }),
  create: (formData: FormData) => API.post(withToken('/tasks'), formData),
  update: (id: string, formData: FormData) => API.put(withToken(`/tasks/${id}`), formData),
  remove: (id: string) => API.delete(withToken(`/tasks/${id}`)),
  weather: (city: string) => API.get(withToken(`/tasks/weather/${encodeURIComponent(city)}`)),
};

declare global {
  interface Window {
    __TASKFLOW_TOKEN__?: string | null;
  }
}
