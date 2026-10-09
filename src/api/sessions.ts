import { request } from './client';
import type { DateRange, Paginated, Session, SessionInput, WeeklyLoad } from './types';

export interface ListSessionsParams extends DateRange {
  page?: number;
  limit?: number;
}

export function listSessions(
  athleteId: string,
  params: ListSessionsParams = {},
  signal?: AbortSignal,
) {
  return request<Paginated<Session>>(`/athletes/${encodeURIComponent(athleteId)}/sessions`, {
    query: { from: params.from, to: params.to, page: params.page, limit: params.limit },
    signal,
  });
}

export function getSession(id: string, signal?: AbortSignal) {
  return request<Session>(`/sessions/${encodeURIComponent(id)}`, { signal });
}

export function createSession(athleteId: string, input: SessionInput) {
  return request<Session>(`/athletes/${encodeURIComponent(athleteId)}/sessions`, {
    method: 'POST',
    body: input,
  });
}

export function updateSession(id: string, changes: Partial<SessionInput>) {
  return request<Session>(`/sessions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: changes,
  });
}

export function deleteSession(id: string) {
  return request<void>(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function getTrainingLoad(athleteId: string, range: DateRange = {}, signal?: AbortSignal) {
  return request<WeeklyLoad[]>(`/athletes/${encodeURIComponent(athleteId)}/training-load`, {
    query: { from: range.from, to: range.to },
    signal,
  });
}
