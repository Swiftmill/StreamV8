'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ContentCardProps {
  id: string;
  title: string;
  description: string;
  href: string;
  posterUrl: string;
  backdropUrl: string;
  badge?: string;
  meta?: string;
}

export function ContentCard({ id, title, description, href, posterUrl, backdropUrl, badge, meta }: ContentCardProps) {
  const [hovered, setHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (hovered) {
      timerRef.current = setTimeout(() => setShowPreview(true), 320);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setShowPreview(false);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [hovered]);

  return (
    <motion.div
      layout
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative h-48 w-32 flex-shrink-0 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-transform hover:z-20 hover:scale-105 md:h-60 md:w-40 lg:h-72 lg:w-48"
    >
      <Link href={href} className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
        <Image
          src={posterUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 40vw, 25vw"
          className="object-cover"
          priority={false}
        />
        <motion.div
          animate={{ opacity: showPreview ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4"
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold leading-snug">{title}</p>
            {meta && <span className="text-xs text-[var(--text-secondary)]">{meta}</span>}
            <p className="line-clamp-3 text-xs text-[var(--text-secondary)]">{description}</p>
          </div>
        </motion.div>
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-[rgba(229,9,20,0.9)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide">{badge}</span>
        )}
      </Link>
    </motion.div>
  );
}
