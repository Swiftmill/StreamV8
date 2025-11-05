'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollButtonProps {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}

const icons = {
  left: ChevronLeft,
  right: ChevronRight
};

export function ScrollButton({ direction, disabled, onClick }: ScrollButtonProps) {
  const Icon = icons[direction];
  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Faire défiler vers la gauche' : 'Faire défiler vers la droite'}
      className={`group absolute top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(10,10,10,0.72)] text-white backdrop-blur transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${direction === 'left' ? 'left-2' : 'right-2'} ${disabled ? 'cursor-default opacity-0' : 'opacity-100'}`}
      onClick={onClick}
    >
      <Icon className="h-6 w-6" />
    </motion.button>
  );
}
