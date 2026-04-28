import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfiles, useDeleteProfile, useCreateProfile } from '@/hooks/useProfiles';
import { useMixerStore } from '@/hooks/useSoundMixer';
import { useAudioEngine } from '@/context/AudioContext';
import { getSoundById } from '@/constants/sounds';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import type { Profile } from '@shared/types';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const { data: profiles, isLoading, error } = useProfiles();
  const deleteMutation = useDeleteProfile();
  const createMutation = useCreateProfile();
  const loadProfile = useMixerStore(s => s.loadProfile);
  const getCurrentMixPayload = useMixerStore(s => s.getCurrentMixPayload);
  const engine = useAudioEngine();
  const activeSounds = useMixerStore(s => s.activeSounds);

  const handleLoadProfile = useCallback(async (profile: Profile) => {
    // Stop all current sounds
    for (const id of Object.keys(activeSounds)) {
      engine.stop(id);
    }

    loadProfile(profile);

    // Start playing all sounds in the profile
    for (const entry of profile.sounds) {
      const def = getSoundById(entry.soundId);
      if (def) {
        try {
          await engine.play(entry.soundId, def.audioUrl, entry.volume);
          useMixerStore.getState().setSoundPlaying(entry.soundId, true);
        } catch {
          useMixerStore.getState().setSoundError(entry.soundId, 'Failed to load');
        }
      }
    }
    engine.setMasterVolume(profile.masterVolume);
    toast.success(`Loaded "${profile.name}"`);
  }, [activeSounds, engine, loadProfile]);

  const handleDelete = useCallback((id: string, name: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(`Deleted "${name}"`),
      onError: () => toast.error('Failed to delete profile'),
    });
  }, [deleteMutation]);

  const handleSave = useCallback((name: string, description: string) => {
    const payload = getCurrentMixPayload();
    if (payload.sounds.length === 0) {
      toast.error('No sounds active to save');
      return;
    }
    createMutation.mutate(
      { name, description: description || undefined, ...payload },
      {
        onSuccess: () => {
          toast.success(`Saved "${name}"`);
          setSaveModalOpen(false);
        },
        onError: () => toast.error('Failed to save profile'),
      }
    );
  }, [getCurrentMixPayload, createMutation]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.3)',
                zIndex: 60,
              }}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 360,
                maxWidth: '90vw',
                background: 'rgba(14, 17, 30, 0.95)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                zIndex: 70,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-16px 0 48px rgba(0,0,0,0.4)',
              }}
            >
              {/* Drawer header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 20px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h2 style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.9)',
                }}>
                  Saved Profiles
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close profiles"
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Save button */}
              <div style={{ padding: '16px 20px' }}>
                <button
                  onClick={() => setSaveModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(6,182,212,0.2))',
                    border: '1px solid rgba(167,139,250,0.25)',
                    color: '#a78bfa',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Save Current Mix
                </button>
              </div>

              {/* Profile list */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 20px 20px',
              }}>
                {isLoading && (
                  <div style={{
                    textAlign: 'center',
                    padding: 40,
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.85rem',
                  }}>
                    Loading profiles...
                  </div>
                )}

                {error && (
                  <div style={{
                    textAlign: 'center',
                    padding: 40,
                    color: '#f87171',
                    fontSize: '0.85rem',
                  }}>
                    Failed to load profiles
                  </div>
                )}

                {profiles && profiles.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: 40,
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.85rem',
                  }}>
                    No saved profiles yet.
                    <br/>
                    Mix some sounds and save your first profile!
                  </div>
                )}

                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <AnimatePresence>
                    {profiles?.map(profile => (
                      <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        layout
                        style={{
                          padding: 16,
                          borderRadius: 16,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 8,
                        }}>
                          <div>
                            <div style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: 'rgba(255,255,255,0.9)',
                            }}>
                              {profile.name}
                            </div>
                            {profile.description && (
                              <div style={{
                                fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.4)',
                                marginTop: 2,
                              }}>
                                {profile.description}
                              </div>
                            )}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255,255,255,0.25)',
                            whiteSpace: 'nowrap',
                          }}>
                            {profile.sounds.length} sounds
                          </div>
                        </div>

                        {/* Sound chips */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 4,
                          marginBottom: 12,
                        }}>
                          {profile.sounds.map(s => {
                            const def = getSoundById(s.soundId);
                            return def ? (
                              <span
                                key={s.soundId}
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '2px 8px',
                                  borderRadius: 20,
                                  background: `${def.color}18`,
                                  color: def.color,
                                  border: `1px solid ${def.color}25`,
                                }}
                              >
                                {def.name}
                              </span>
                            ) : null;
                          })}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => void handleLoadProfile(profile)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: 10,
                              background: 'rgba(167,139,250,0.12)',
                              border: '1px solid rgba(167,139,250,0.2)',
                              color: '#a78bfa',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDelete(profile.id, profile.name)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              background: 'rgba(239,68,68,0.08)',
                              border: '1px solid rgba(239,68,68,0.15)',
                              color: '#f87171',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Save Modal */}
      <SaveProfileModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSave}
        isLoading={createMutation.isPending}
      />
    </>
  );
}

function SaveProfileModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Profile">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 6,
          }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Rainy Forest"
            maxLength={100}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 6,
          }}>
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A calming forest mix..."
            maxLength={500}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              background: name.trim()
                ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                : 'rgba(255,255,255,0.06)',
              border: 'none',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              opacity: name.trim() && !isLoading ? 1 : 0.4,
              cursor: name.trim() && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
