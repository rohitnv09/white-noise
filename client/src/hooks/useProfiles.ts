import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import type { CreateProfilePayload, UpdateProfilePayload } from '@shared/types';

const PROFILES_KEY = ['profiles'] as const;

export function useProfiles() {
  return useQuery({
    queryKey: PROFILES_KEY,
    queryFn: api.fetchProfiles,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProfilePayload) => api.createProfile(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfilePayload }) =>
      api.updateProfile(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProfile(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
    },
  });
}
