import type {
  Profile,
  CreateProfilePayload,
  UpdateProfilePayload,
  ApiResponse,
} from '@shared/types';

const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await request<ApiResponse<Profile[]>>('/profiles');
  return res.data;
}

export async function fetchProfile(id: string): Promise<Profile> {
  const res = await request<ApiResponse<Profile>>(`/profiles/${id}`);
  return res.data;
}

export async function createProfile(data: CreateProfilePayload): Promise<Profile> {
  const res = await request<ApiResponse<Profile>>('/profiles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateProfile(id: string, data: UpdateProfilePayload): Promise<Profile> {
  const res = await request<ApiResponse<Profile>>(`/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteProfile(id: string): Promise<void> {
  await request(`/profiles/${id}`, { method: 'DELETE' });
}
