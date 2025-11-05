'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeroBannerProps {
  title: string;
  description: string;
  backdropUrl: string;
  ctaHref: string;
  meta?: string;
}

export function HeroBanner({ title, description, backdropUrl, ctaHref, meta }: HeroBannerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-gradient-to-br from-[#151515] via-[#0f0f0f] to-[#050505]"
    >
      <div className="absolute inset-0">
        <Image
          src={backdropUrl}
          alt={title}
          fill
          className="object-cover opacity-40"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      </div>
      <div className="relative z-10 flex flex-col gap-5 p-10 md:max-w-2xl">
        <span className="inline-flex w-max items-center gap-2 rounded-full bg-[rgba(255,255,255,0.12)] px-4 py-1 text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
          Exclusivité
        </span>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{title}</h1>
        {meta && <p className="text-sm text-[var(--text-secondary)]">{meta}</p>}
        <p className="text-base text-[var(--text-secondary)] md:text-lg">{description}</p>
        <div className="flex flex-wrap gap-4">
          <Link
            href={ctaHref}
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            ▶ Lire maintenant
          </Link>
          <Link
            href={`${ctaHref}?preview=1`}
            className="flex items-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.24)] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            ℹ︎ Détails
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
