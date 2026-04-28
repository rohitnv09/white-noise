import { motion } from 'framer-motion';
import { SOUND_CATALOG } from '@/constants/sounds';
import { SoundCard } from './SoundCard';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function SoundGrid() {
  return (
    <>
      <motion.div
        className="sound-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {SOUND_CATALOG.map(sound => (
          <motion.div key={sound.id} variants={item} style={{ minWidth: 0, minHeight: 0 }}>
            <SoundCard sound={sound} />
          </motion.div>
        ))}
      </motion.div>

      <style>{`
        .sound-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding: 4px 24px 24px;
          max-width: 960px;
          margin: 0 auto;
          width: 100%;
        }

        @media (max-width: 900px) {
          .sound-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
          }
        }

        @media (max-width: 640px) {
          .sound-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            padding: 4px 16px 16px;
          }
        }

        @media (max-width: 380px) {
          .sound-grid {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 4px 12px 12px;
          }
        }
      `}</style>
    </>
  );
}
