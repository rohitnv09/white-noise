import { create } from 'zustand';
import type { Profile, SoundMixEntry } from '@shared/types';

export interface ActiveSound {
  soundId: string;
  volume: number;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

interface MixerState {
  activeSounds: Record<string, ActiveSound>;
  masterVolume: number;
  toggleSound: (soundId: string, defaultVolume?: number) => void;
  setSoundVolume: (soundId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  setSoundLoading: (soundId: string, loading: boolean) => void;
  setSoundError: (soundId: string, error: string | null) => void;
  setSoundPlaying: (soundId: string, playing: boolean) => void;
  loadProfile: (profile: Profile) => void;
  reset: () => void;
  getActiveSoundsList: () => ActiveSound[];
  getCurrentMixPayload: () => { sounds: SoundMixEntry[]; masterVolume: number };
}

export const useMixerStore = create<MixerState>((set, get) => ({
  activeSounds: {},
  masterVolume: 0.7,

  toggleSound: (soundId: string, defaultVolume = 0.6) => {
    set(state => {
      const existing = state.activeSounds[soundId];
      if (existing) {
        const { [soundId]: _, ...rest } = state.activeSounds;
        return { activeSounds: rest };
      }
      return {
        activeSounds: {
          ...state.activeSounds,
          [soundId]: {
            soundId,
            volume: defaultVolume,
            isPlaying: false,
            isLoading: false,
            error: null,
          },
        },
      };
    });
  },

  setSoundVolume: (soundId: string, volume: number) => {
    set(state => {
      const sound = state.activeSounds[soundId];
      if (!sound) return state;
      return {
        activeSounds: {
          ...state.activeSounds,
          [soundId]: { ...sound, volume },
        },
      };
    });
  },

  setMasterVolume: (volume: number) => set({ masterVolume: volume }),

  setSoundLoading: (soundId: string, loading: boolean) => {
    set(state => {
      const sound = state.activeSounds[soundId];
      if (!sound) return state;
      return {
        activeSounds: {
          ...state.activeSounds,
          [soundId]: { ...sound, isLoading: loading },
        },
      };
    });
  },

  setSoundError: (soundId: string, error: string | null) => {
    set(state => {
      const sound = state.activeSounds[soundId];
      if (!sound) return state;
      return {
        activeSounds: {
          ...state.activeSounds,
          [soundId]: { ...sound, error, isLoading: false },
        },
      };
    });
  },

  setSoundPlaying: (soundId: string, playing: boolean) => {
    set(state => {
      const sound = state.activeSounds[soundId];
      if (!sound) return state;
      return {
        activeSounds: {
          ...state.activeSounds,
          [soundId]: { ...sound, isPlaying: playing, isLoading: false },
        },
      };
    });
  },

  loadProfile: (profile: Profile) => {
    const activeSounds: Record<string, ActiveSound> = {};
    for (const entry of profile.sounds) {
      activeSounds[entry.soundId] = {
        soundId: entry.soundId,
        volume: entry.volume,
        isPlaying: false,
        isLoading: false,
        error: null,
      };
    }
    set({ activeSounds, masterVolume: profile.masterVolume });
  },

  reset: () => set({ activeSounds: {}, masterVolume: 0.7 }),

  getActiveSoundsList: () => Object.values(get().activeSounds),

  getCurrentMixPayload: () => {
    const state = get();
    const sounds: SoundMixEntry[] = Object.values(state.activeSounds).map(s => ({
      soundId: s.soundId,
      volume: s.volume,
    }));
    return { sounds, masterVolume: state.masterVolume };
  },
}));
