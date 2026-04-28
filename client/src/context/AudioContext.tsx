import { createContext, useContext, useRef, useEffect, type ReactNode } from 'react';
import { NatureAudioEngine } from '@/lib/audioEngine';

interface AudioContextValue {
  engine: NatureAudioEngine;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<NatureAudioEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new NatureAudioEngine();
  }

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
    };
  }, []);

  return (
    <AudioCtx.Provider value={{ engine: engineRef.current }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudioEngine(): NatureAudioEngine {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudioEngine must be used within AudioProvider');
  return ctx.engine;
}
