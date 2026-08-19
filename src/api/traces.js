import { authedRequest } from './client';

export const createTrace = (payload) => authedRequest('/traces', { method: 'POST', body: payload });

export const listTraces = (limit = 20, offset = 0) =>
  authedRequest(`/traces?limit=${limit}&offset=${offset}`);

export const getTrace = (id) => authedRequest(`/traces/${id}`);

export const deleteTrace = (id) => authedRequest(`/traces/${id}`, { method: 'DELETE' });
