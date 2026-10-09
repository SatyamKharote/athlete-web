import { request } from './client';
import type { Athlete, AthleteInput, Paginated } from './types';

export interface ListAthletesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export function listAthletes(params: ListAthletesParams = {}, signal?: AbortSignal) {
  return request<Paginated<Athlete>>('/athletes', {
    query: { search: params.search, page: params.page, limit: params.limit },
    signal,
  });
}

export function getAthlete(id: string, signal?: AbortSignal) {
  return request<Athlete>(`/athletes/${encodeURIComponent(id)}`, { signal });
}

export function createAthlete(input: AthleteInput) {
  return request<Athlete>('/athletes', { method: 'POST', body: input });
}

export function updateAthlete(id: string, changes: Partial<AthleteInput>) {
  return request<Athlete>(`/athletes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: changes,
  });
}

export function deleteAthlete(id: string) {
  return request<void>(`/athletes/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
