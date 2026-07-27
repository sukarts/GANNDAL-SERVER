const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'ADMIN' | 'REDACTEUR' | 'JRI' | 'COMPTABLE';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ganndal_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ganndal_refresh');
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('ganndal_user');
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function setSession(token: string, user: AuthUser, refresh?: string): void {
  localStorage.setItem('ganndal_token', token);
  localStorage.setItem('ganndal_user', JSON.stringify(user));
  if (refresh) localStorage.setItem('ganndal_refresh', refresh);
}

export function clearSession(): void {
  localStorage.removeItem('ganndal_token');
  localStorage.removeItem('ganndal_user');
  localStorage.removeItem('ganndal_refresh');
}

// Met à jour les infos utilisateur en cache (après édition de profil)
export function updateStoredUser(patch: Partial<AuthUser>): void {
  const u = getUser();
  if (u) localStorage.setItem('ganndal_user', JSON.stringify({ ...u, ...patch }));
}

// --- Refresh silencieux -----------------------------------------------------
// Rejoue une seule tentative de rafraîchissement du token d'accès sur 401,
// de façon dédupliquée (une seule requête /refresh même si plusieurs appels
// échouent en même temps).
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string };
    localStorage.setItem('ganndal_token', data.accessToken);
    return true;
  } catch {
    return false;
  }
}

function refreshAccess(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

function onSessionExpired(): void {
  clearSession();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

// Effectue un fetch authentifié avec retry unique après refresh sur 401.
async function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const build = (): RequestInit => {
    const token = getToken();
    return {
      ...init,
      headers: { ...(init.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    };
  };
  let res = await fetch(url, build());
  if (res.status === 401 && getRefreshToken()) {
    const ok = await refreshAccess();
    if (ok) {
      res = await fetch(url, build());
    }
    if (res.status === 401) onSessionExpired();
  }
  return res;
}

async function parseError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  throw new Error(body.error ?? `Erreur ${res.status}`);
}

// Liste paginée : renvoie les éléments + le total (header X-Total-Count)
export async function apiPaged<T = unknown>(path: string, page: number, limit = 25): Promise<{ items: T[]; total: number }> {
  const sep = path.includes('?') ? '&' : '?';
  const res = await authedFetch(`${API}${path}${sep}page=${page}&limit=${limit}`);
  if (!res.ok) await parseError(res);
  const items = (await res.json()) as T[];
  const total = Number(res.headers.get('X-Total-Count') ?? items.length);
  return { items, total };
}

// Upload multipart (fichiers) — ne pas fixer Content-Type (boundary auto)
export async function apiUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
  const res = await authedFetch(`${API}${path}`, { method: 'POST', body: formData });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<T>;
}

// Télécharge un fichier protégé (auth) et déclenche l'enregistrement navigateur
export async function apiDownload(path: string, filename: string): Promise<void> {
  const res = await authedFetch(`${API}${path}`);
  if (!res.ok) await parseError(res);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await authedFetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<T>;
}
