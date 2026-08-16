import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export async function authFetch(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : ''
    }
  });
  if (response.status === 401) {
    clearToken();
  }
  return response;
}
