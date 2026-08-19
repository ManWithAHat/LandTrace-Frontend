import { authedRequest } from './client';

export const listConflicts = (status = 'open', limit = 20, offset = 0) =>
  authedRequest(`/conflicts?status=${status}&limit=${limit}&offset=${offset}`);

export const getConflict = (id) => authedRequest(`/conflicts/${id}`);

export const addConflictNote = (id, text) =>
  authedRequest(`/conflicts/${id}/notes`, { method: 'POST', body: { text } });

export const updateConflictStatus = (id, status, resolution_note) =>
  authedRequest(`/conflicts/${id}/status`, { method: 'PATCH', body: { status, resolution_note } });
