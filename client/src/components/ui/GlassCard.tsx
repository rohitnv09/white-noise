import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  active?: boolean;
}

export function GlassCard({ children, className, glowColor, active, style, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={clsx('glass-card', active && 'glass-card--active', className)}
      style={{
        background: active ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${active ? (glowColor ?? 'rgba(255,255,255,0.15)') + '40' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 20,
        boxShadow: active && glowColor
          ? `0 0 40px ${glowColor}20, 0 8px 32px rgba(0,0,0,0.3)`
          : '0 4px 16px rgba(0,0,0,0.2)',
        transition: 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
