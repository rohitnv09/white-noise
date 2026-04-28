export interface SoundMixEntry {
  soundId: string;
  volume: number;
}

export interface Profile {
  id: string;
  name: string;
  description?: string;
  sounds: SoundMixEntry[];
  masterVolume: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfilePayload {
  name: string;
  description?: string;
  sounds: SoundMixEntry[];
  masterVolume: number;
}

export interface UpdateProfilePayload {
  name?: string;
  description?: string;
  sounds?: SoundMixEntry[];
  masterVolume?: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
