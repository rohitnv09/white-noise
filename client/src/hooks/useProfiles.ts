import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as profilesDb from '@/lib/profilesDb';
import type { CreateProfilePayload, UpdateProfilePayload } from '@shared/types';

const PROFILES_KEY = ['profiles'] as const;

export function useProfiles() {
  return useQuery({
    queryKey: PROFILES_KEY,
    queryFn: profilesDb.fetchProfiles,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProfilePayload) => profilesDb.createProfile(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfilePayload }) =>
      profilesDb.updateProfile(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profilesDb.deleteProfile(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
    },
  });
}
