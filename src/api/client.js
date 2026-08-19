import * as SecureStore from 'expo-secure-store';

export const BASE_URL = 'https://landtrace-backend.onrender.com';

const ACCESS_KEY = 'landtrace_access_token';
const REFRESH_KEY = 'landtrace_refresh_token';

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function getTokens() {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return { access, refresh };
}

export async function setTokens({ access_token, refresh_token }) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access_token),
    refresh_token ? SecureStore.setItemAsync(REFRESH_KEY, refresh_token) : Promise.resolve(),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

async function rawRequest(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let json = null;
  try {
    json = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok) {
    const err = json?.error ?? { code: 'UNKNOWN', message: `Request failed (${res.status})` };
    throw new ApiError(err.code, err.message, res.status);
  }

  return json;
}

/** Unauthenticated request — OTP request/verify, no token, no refresh retry. */
export function publicRequest(path, options = {}) {
  return rawRequest(path, options);
}

let refreshPromise = null;

async function refreshAccessToken() {
  const { refresh } = await getTokens();
  if (!refresh) throw new ApiError('UNAUTHORIZED', 'No refresh token available', 401);

  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/token/refresh', {
      method: 'POST',
      body: { refresh_token: refresh },
    })
      .then(async (data) => {
        await setTokens(data);
        return data;
      })
      .catch(async (err) => {
        await clearTokens();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** Authenticated request — attaches the access token, retries once via refresh on 401. */
export async function authedRequest(path, options = {}) {
  const { access } = await getTokens();
  try {
    return await rawRequest(path, { ...options, token: access });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const { access_token } = await refreshAccessToken();
      return rawRequest(path, { ...options, token: access_token });
    }
    throw err;
  }
}
