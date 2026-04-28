import { useState } from 'react';
import { BackgroundCanvas } from './BackgroundCanvas';
import { Header } from './Header';
import { SoundGrid } from '@/components/sounds/SoundGrid';
import { ProfileDrawer } from '@/components/profiles/ProfileDrawer';
import { MixerVisualization } from '@/components/mixer/MixerVisualization';

export function AppShell() {
  const [profilesOpen, setProfilesOpen] = useState(false);

  return (
    <div style={{
      position: 'relative',
      minHeight: '100dvh',
      isolation: 'isolate',
      overflowX: 'hidden',
    }}>
      <BackgroundCanvas />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header
          onToggleProfiles={() => setProfilesOpen(prev => !prev)}
          profilesOpen={profilesOpen}
        />

        {/* Category label */}
        <div className="section-label" style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '28px 24px 16px',
        }}>
          <h2
            className="gradient-text-subtle"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}
          >
            Soundscapes
          </h2>
        </div>

        <SoundGrid />
      </div>

      <MixerVisualization />

      <ProfileDrawer
        isOpen={profilesOpen}
        onClose={() => setProfilesOpen(false)}
      />
    </div>
  );
}
