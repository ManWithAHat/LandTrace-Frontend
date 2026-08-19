import { publicRequest, setTokens, clearTokens } from './client';

export function requestOtp(phone) {
  return publicRequest('/auth/otp/request', { method: 'POST', body: { phone } });
}

export async function verifyOtp(phone, code) {
  const data = await publicRequest('/auth/otp/verify', { method: 'POST', body: { phone, code } });
  await setTokens(data);
  return data;
}

export async function logout(refreshToken) {
  try {
    await publicRequest('/auth/logout', { method: 'POST', body: { refresh_token: refreshToken } });
  } finally {
    await clearTokens();
  }
}
