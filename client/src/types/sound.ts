export type SoundCategory = 'water' | 'weather' | 'wildlife' | 'environment' | 'atmosphere';

export interface SoundDefinition {
  id: string;
  name: string;
  category: SoundCategory;
  description: string;
  audioUrl: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  defaultVolume: number;
}
