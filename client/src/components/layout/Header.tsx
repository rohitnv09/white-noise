import { VolumeSlider } from '@/components/sounds/VolumeSlider';
import { useMixerStore } from '@/hooks/useSoundMixer';
import { useAudioEngine } from '@/context/AudioContext';
import { useCallback } from 'react';

interface HeaderProps {
  onToggleProfiles: () => void;
  profilesOpen: boolean;
}

export function Header({ onToggleProfiles, profilesOpen }: HeaderProps) {
  const engine = useAudioEngine();
  const masterVolume = useMixerStore(s => s.masterVolume);
  const setMasterVolume = useMixerStore(s => s.setMasterVolume);

  const handleMasterVolume = useCallback(
    (vol: number) => {
      setMasterVolume(vol);
      engine.setMasterVolume(vol);
    },
    [engine, setMasterVolume]
  );

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      height: 56,
      background: 'rgba(10, 14, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      gap: 10,
    }}>
      {/* Logo — allowed to shrink so volume + profile always fit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{'\u{1F33F}'}</span>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h1
            className="gradient-text-animated"
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Nature Sounds
          </h1>
          <p className="header-subtitle" style={{
            fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            immersive soundscapes
          </p>
        </div>
      </div>

      {/* Master Volume — always visible, shrinks gracefully */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        maxWidth: 180,
        minWidth: 60,
      }}>
        <span className="header-volume-icon" style={{ fontSize: 13, opacity: 0.4, flexShrink: 0 }}>{'\u{1F50A}'}</span>
        <VolumeSlider
          value={masterVolume}
          onChange={handleMasterVolume}
          color="#a78bfa"
          label="Master volume"
          compact
        />
      </div>

      {/* Profile Toggle */}
      <button
        onClick={onToggleProfiles}
        aria-label="Toggle profiles panel"
        aria-expanded={profilesOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 10,
          background: profilesOpen ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${profilesOpen ? 'rgba(167, 139, 250, 0.3)' : 'rgba(255,255,255,0.08)'}`,
          color: profilesOpen ? '#a78bfa' : 'rgba(255,255,255,0.7)',
          fontSize: '0.75rem',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span className="header-profiles-label">Profiles</span>
      </button>

      <style>{`
        @media (max-width: 480px) {
          .header-profiles-label { display: none; }
          .header-subtitle { display: none; }
        }
        @media (max-width: 380px) {
          .header-volume-icon { display: none; }
        }
      `}</style>
    </header>
  );
}
