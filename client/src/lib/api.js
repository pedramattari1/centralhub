import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.details);
  }
  return data;
}

/**
 * useApi() — returns get/post/put/del helpers that automatically attach the
 * current Clerk session token to each request.
 */
export function useApi() {
  const { getToken } = useAuth();

  return useMemo(() => {
    const call = async (path, opts = {}) => {
      const token = await getToken();
      return request(path, { ...opts, token });
    };
    return {
      get: (path) => call(path),
      post: (path, body) => call(path, { method: 'POST', body }),
      put: (path, body) => call(path, { method: 'PUT', body }),
      del: (path) => call(path, { method: 'DELETE' }),
    };
  }, [getToken]);
}
