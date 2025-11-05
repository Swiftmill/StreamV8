'use client';

import { motion } from 'framer-motion';

export function CardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.2 }}
      className="card-skeleton h-48 w-32 rounded-2xl md:h-60 md:w-40 lg:h-72 lg:w-48"
    />
  );
}
