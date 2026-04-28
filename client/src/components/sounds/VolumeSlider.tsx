import { useCallback } from 'react';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  color?: string;
  label: string;
  compact?: boolean;
}

export function VolumeSlider({ value, onChange, color = '#8b5cf6', label, compact }: VolumeSliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  const pct = Math.round(value * 100);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: compact ? 8 : 10,
      width: '100%',
    }}>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={handleChange}
        aria-label={label}
        style={{
          flex: 1,
          minWidth: 0,
          height: compact ? 4 : 6,
          appearance: 'none',
          WebkitAppearance: 'none',
          background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
          borderRadius: 100,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
      <span style={{
        fontSize: compact ? 11 : 12,
        color: 'rgba(255,255,255,0.45)',
        minWidth: 28,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {pct}%
      </span>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: ${compact ? 12 : 16}px;
          height: ${compact ? 12 : 16}px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid rgba(255,255,255,0.3);
          box-shadow: 0 0 10px ${color}60;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 16px ${color}80;
        }
        input[type="range"]::-moz-range-thumb {
          width: ${compact ? 12 : 16}px;
          height: ${compact ? 12 : 16}px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid rgba(255,255,255,0.3);
          box-shadow: 0 0 10px ${color}60;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
