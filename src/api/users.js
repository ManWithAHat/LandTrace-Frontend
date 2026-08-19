import { authedRequest } from './client';

export const getMe = () => authedRequest('/users/me');

export const updateMe = (fields) => authedRequest('/users/me', { method: 'PATCH', body: fields });
