let csrfTokenPromise: Promise<string> | null = null;

const readPayload = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => ({}));
  }
  return response.text().catch(() => '');
};

export const getCsrfToken = async () => {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch('/api/auth/csrf', { credentials: 'include' })
      .then(async (response) => {
        const payload = await readPayload(response);
        if (!response.ok || !payload?.csrfToken) {
          throw new Error(payload?.message || 'Failed to initialize session security.');
        }
        return payload.csrfToken as string;
      })
      .catch((error) => {
        csrfTokenPromise = null;
        throw error;
      });
  }
  return csrfTokenPromise;
};

export const clearCachedCsrfToken = () => {
  csrfTokenPromise = null;
};

export const apiFetch = async (input: string, init?: RequestInit) => {
  const method = (init?.method || 'GET').toUpperCase();
  const headers = new Headers(init?.headers || {});
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  if (!headers.has('Content-Type') && init?.body && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('X-CSRF-Token', await getCsrfToken());
  }

  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers,
  });

  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error((payload && typeof payload === 'object' && 'message' in payload ? payload.message : null) || 'Request failed.');
  }
  return payload;
};

export const apiFetchRaw = async (input: string, init?: RequestInit) => {
  const method = (init?.method || 'GET').toUpperCase();
  const headers = new Headers(init?.headers || {});
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  if (!headers.has('Content-Type') && init?.body && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('X-CSRF-Token', await getCsrfToken());
  }

  return fetch(input, {
    credentials: 'include',
    ...init,
    headers,
  });
};
