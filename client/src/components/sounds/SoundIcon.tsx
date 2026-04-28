import { motion } from 'framer-motion';
import type { SoundCategory } from '@/types/sound';

interface SoundIconProps {
  soundId: string;
  category: SoundCategory;
  isPlaying: boolean;
  color: string;
  size?: number;
}

export function SoundIcon({ soundId, category, isPlaying, color, size = 40 }: SoundIconProps) {
  return (
    <motion.div
      animate={isPlaying ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={isPlaying ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.6,
        filter: isPlaying ? `drop-shadow(0 0 8px ${color}80)` : 'none',
        transition: 'filter 0.3s ease',
      }}
    >
      {getIcon(soundId, category)}
    </motion.div>
  );
}

function getIcon(soundId: string, category: SoundCategory): string {
  const iconMap: Record<string, string> = {
    'rain-gentle': '\u{1F327}\u{FE0F}',
    'rain-heavy': '\u{26C8}\u{FE0F}',
    'thunder': '\u{26A1}',
    'ocean-waves': '\u{1F30A}',
    'creek': '\u{1F4A7}',
    'waterfall': '\u{1F4A6}',
    'birds-morning': '\u{1F426}',
    'crickets': '\u{1F997}',
    'frogs': '\u{1F438}',
    'fire': '\u{1F525}',
    'wind': '\u{1F343}',
    'forest': '\u{1F332}',
  };

  const categoryFallback: Record<SoundCategory, string> = {
    water: '\u{1F30A}',
    weather: '\u{1F327}\u{FE0F}',
    wildlife: '\u{1F43E}',
    environment: '\u{1F3D5}\u{FE0F}',
    atmosphere: '\u{2728}',
  };

  return iconMap[soundId] ?? categoryFallback[category];
}
