import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { SoundIcon } from './SoundIcon';
import { VolumeSlider } from './VolumeSlider';
import { useAudioEngine } from '@/context/AudioContext';
import { useMixerStore } from '@/hooks/useSoundMixer';
import type { SoundDefinition } from '@/types/sound';

interface SoundCardProps {
  sound: SoundDefinition;
}

export function SoundCard({ sound }: SoundCardProps) {
  const engine = useAudioEngine();
  const activeSound = useMixerStore(s => s.activeSounds[sound.id]);
  const toggleSound = useMixerStore(s => s.toggleSound);
  const setSoundVolume = useMixerStore(s => s.setSoundVolume);
  const setSoundLoading = useMixerStore(s => s.setSoundLoading);
  const setSoundPlaying = useMixerStore(s => s.setSoundPlaying);
  const setSoundError = useMixerStore(s => s.setSoundError);

  const isActive = !!activeSound;
  const isPlaying = activeSound?.isPlaying ?? false;
  const isLoading = activeSound?.isLoading ?? false;
  const volume = activeSound?.volume ?? sound.defaultVolume;

  const handleToggle = useCallback(async () => {
    if (isActive) {
      engine.stop(sound.id);
      toggleSound(sound.id);
    } else {
      const rememberedVolume = useMixerStore.getState().soundVolumes[sound.id] ?? sound.defaultVolume;
      toggleSound(sound.id, sound.defaultVolume);
      setSoundLoading(sound.id, true);
      try {
        await engine.play(sound.id, sound.audioUrl, rememberedVolume);
        setSoundPlaying(sound.id, true);
      } catch (err) {
        setSoundError(sound.id, err instanceof Error ? err.message : 'Failed to load');
      }
    }
  }, [isActive, sound, engine, toggleSound, setSoundLoading, setSoundPlaying, setSoundError]);

  const handleVolumeChange = useCallback(
    (vol: number) => {
      setSoundVolume(sound.id, vol);
      engine.setVolume(sound.id, vol);
    },
    [sound.id, engine, setSoundVolume]
  );

  return (
    <GlassCard
      active={isActive}
      glowColor={sound.color}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        padding: 0,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Internal RGB edge-dancing light when active */}
      <AnimatePresence>
        {isActive && (
          <>
            {/* Rotating conic glow — spins around the card edges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                position: 'absolute',
                inset: -2,
                borderRadius: 22,
                overflow: 'hidden',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            >
              <div style={{
                position: 'absolute',
                inset: '-50%',
                background: `conic-gradient(
                  from 0deg,
                  transparent 0%,
                  ${sound.gradientFrom}50 10%,
                  ${sound.color}70 20%,
                  ${sound.gradientTo}50 30%,
                  transparent 40%,
                  transparent 60%,
                  ${sound.gradientTo}50 70%,
                  ${sound.color}70 80%,
                  ${sound.gradientFrom}50 90%,
                  transparent 100%
                )`,
                animation: 'edge-glow-rotate 4s linear infinite',
              }} />
              {/* Inner mask to only show the edge glow */}
              <div style={{
                position: 'absolute',
                inset: 3,
                borderRadius: 19,
                background: 'var(--bg-primary)',
              }} />
            </motion.div>

            {/* Edge light — top (travels left to right) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '40%',
                height: 2,
                borderRadius: '0 2px 2px 0',
                background: `linear-gradient(90deg, transparent, ${sound.color}, transparent)`,
                filter: `blur(1px) drop-shadow(0 0 6px ${sound.color})`,
                animation: 'edge-dance-top 2.5s ease-in-out infinite',
                zIndex: 0,
              }}
            />
            {/* Edge light — right (travels top to bottom) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 2,
                height: '40%',
                borderRadius: '0 0 2px 2px',
                background: `linear-gradient(180deg, transparent, ${sound.gradientTo}, transparent)`,
                filter: `blur(1px) drop-shadow(0 0 6px ${sound.gradientTo})`,
                animation: 'edge-dance-right 3s ease-in-out infinite',
                animationDelay: '0.6s',
                zIndex: 0,
              }}
            />
            {/* Edge light — bottom (travels right to left) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 1.2 }}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '40%',
                height: 2,
                borderRadius: '2px 0 0 2px',
                background: `linear-gradient(270deg, transparent, ${sound.gradientFrom}, transparent)`,
                filter: `blur(1px) drop-shadow(0 0 6px ${sound.gradientFrom})`,
                animation: 'edge-dance-bottom 2.8s ease-in-out infinite',
                animationDelay: '1.2s',
                zIndex: 0,
              }}
            />
            {/* Edge light — left (travels bottom to top) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 1.8 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 2,
                height: '40%',
                borderRadius: '2px 2px 0 0',
                background: `linear-gradient(0deg, transparent, ${sound.color}, transparent)`,
                filter: `blur(1px) drop-shadow(0 0 6px ${sound.color})`,
                animation: 'edge-dance-left 3.2s ease-in-out infinite',
                animationDelay: '1.8s',
                zIndex: 0,
              }}
            />

            {/* Full internal ambient wash */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 20,
                background: `linear-gradient(
                  135deg,
                  ${sound.gradientFrom}18 0%,
                  ${sound.color}12 30%,
                  ${sound.gradientTo}18 60%,
                  ${sound.color}12 100%
                )`,
                backgroundSize: '200% 200%',
                animation: 'rgb-flow 5s ease infinite',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />

            {/* Soft inner glow — gentle opacity pulse, no scale */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 20,
                background: `radial-gradient(ellipse at 50% 60%, ${sound.color}25 0%, ${sound.gradientTo}10 40%, transparent 70%)`,
                animation: 'pulse-glow 3.5s ease-in-out infinite',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />

            {/* Corner accent glows — enlarged and brighter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                top: -15,
                left: -15,
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${sound.gradientFrom}50, transparent 70%)`,
                filter: 'blur(12px)',
                animation: 'pulse-glow 2.5s ease-in-out infinite',
                zIndex: 0,
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              style={{
                position: 'absolute',
                bottom: -15,
                right: -15,
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${sound.gradientTo}50, transparent 70%)`,
                filter: 'blur(12px)',
                animation: 'pulse-glow 2.5s ease-in-out infinite',
                animationDelay: '1.2s',
                zIndex: 0,
              }}
            />
            {/* Top-right corner glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{
                position: 'absolute',
                top: -10,
                right: -10,
                width: 55,
                height: 55,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${sound.color}40, transparent 70%)`,
                filter: 'blur(10px)',
                animation: 'pulse-glow 3s ease-in-out infinite',
                animationDelay: '0.6s',
                zIndex: 0,
              }}
            />
            {/* Bottom-left corner glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              style={{
                position: 'absolute',
                bottom: -10,
                left: -10,
                width: 55,
                height: 55,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${sound.color}40, transparent 70%)`,
                filter: 'blur(10px)',
                animation: 'pulse-glow 3s ease-in-out infinite',
                animationDelay: '1.8s',
                zIndex: 0,
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Card content */}
      <div
        className="sound-card__content"
        role="switch"
        aria-checked={isActive}
        aria-label={`Toggle ${sound.name}`}
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void handleToggle();
          }
        }}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          outline: 'none',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {/* Loading spinner overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              background: 'rgba(10,14,26,0.4)',
              borderRadius: '20px 20px 0 0',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="sound-card__spinner"
              style={{
                borderRadius: '50%',
                border: `2px solid ${sound.color}30`,
                borderTopColor: sound.color,
              }}
            />
          </motion.div>
        )}

        <SoundIcon
          soundId={sound.id}
          category={sound.category}
          isPlaying={isPlaying}
          color={sound.color}
        />

        <div style={{ textAlign: 'center' }}>
          <div className="sound-card__name" style={{
            fontWeight: 600,
            color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
            transition: 'color 0.3s ease',
            letterSpacing: '0.01em',
            lineHeight: 1.3,
          }}>
            {sound.name}
          </div>
          <div className="sound-card__desc" style={{
            color: isActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)',
            marginTop: 2,
            transition: 'color 0.3s ease',
            lineHeight: 1.3,
          }}>
            {sound.description}
          </div>
        </div>

        {/* Active indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: sound.color,
                boxShadow: `0 0 10px ${sound.color}, 0 0 20px ${sound.color}60`,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Volume slider - always at bottom */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sound-card__slider" style={{
              borderTop: `1px solid ${sound.color}15`,
            }}>
              <VolumeSlider
                value={volume}
                onChange={handleVolumeChange}
                color={sound.color}
                label={`${sound.name} volume`}
                compact
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
