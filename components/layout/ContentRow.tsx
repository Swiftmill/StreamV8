'use client';

import { motion } from 'framer-motion';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';
import { ScrollButton } from '../ui/ScrollButton';
import { ContentCard } from '../ui/ContentCard';

export interface ContentRowItem {
  id: string;
  title: string;
  description: string;
  href: string;
  posterUrl: string;
  backdropUrl: string;
  badge?: string;
  meta?: string;
}

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items: ContentRowItem[];
}

export function ContentRow({ title, subtitle, items }: ContentRowProps) {
  const { bind, isAtStart, isAtEnd, scrollBy } = useHorizontalScroll();
  const scrollAmount = 320;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-2xl font-semibold">
          {title}
        </motion.h2>
        {subtitle && <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      <div className="relative">
        <ScrollButton direction="left" disabled={isAtStart} onClick={() => scrollBy(-scrollAmount)} />
        <div
          {...bind}
          className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-2 pr-8"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((item) => (
            <motion.div
              key={item.id}
              style={{ scrollSnapAlign: 'start' }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
            >
              <ContentCard {...item} />
            </motion.div>
          ))}
        </div>
        <ScrollButton direction="right" disabled={isAtEnd} onClick={() => scrollBy(scrollAmount)} />
      </div>
    </section>
  );
}
