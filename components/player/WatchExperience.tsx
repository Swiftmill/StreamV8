'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StreamPlayer } from './StreamPlayer';
import { useAuth } from '../providers/AuthProvider';
import { apiFetch } from '../../lib/api-client';

interface NextEpisode {
  href: string;
  label: string;
}

interface WatchExperienceProps {
  type: 'movie' | 'series';
  contentId: string;
  source: string;
  poster?: string;
  subtitles: { language: string; url: string }[];
  metadata: string;
  title: string;
  nextEpisode?: NextEpisode;
  season?: number;
  episode?: number;
}

export function WatchExperience(props: WatchExperienceProps) {
  const { type, contentId, source, poster, subtitles, title, metadata, nextEpisode, season, episode } = props;
  const { csrfToken } = useAuth();
  const router = useRouter();
  const lastProgressRef = useRef(0);
  const lastSyncRef = useRef(0);

  const handleProgress = useCallback(
    async (progress: number) => {
      if (!csrfToken) return;
      lastProgressRef.current = progress;
      const now = Date.now();
      if (progress < 0.05) return;
      if (now - lastSyncRef.current < 5000 && progress < 0.95) return;
      lastSyncRef.current = now;
      await apiFetch('/api/history', {
        method: 'POST',
        csrfToken,
        body: {
          contentId,
          type,
          progress,
          season,
          episode,
          lastWatched: new Date().toISOString()
        }
      }).catch(() => {
        /* ignore */
      });
    },
    [csrfToken, contentId, type, season, episode]
  );

  const handleEnded = useCallback(async () => {
    await handleProgress(1);
    if (nextEpisode) {
      router.push(nextEpisode.href);
    }
  }, [handleProgress, nextEpisode, router]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[32px] border border-[rgba(255,255,255,0.12)] bg-black/50 p-4 shadow-2xl">
        <StreamPlayer source={source} poster={poster} subtitles={subtitles} onProgress={handleProgress} onEnded={handleEnded} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{metadata}</p>
        {nextEpisode && (
          <button
            type="button"
            onClick={() => router.push(nextEpisode.href)}
            className="mt-2 w-full rounded-2xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:w-max"
          >
            ▶ {nextEpisode.label}
          </button>
        )}
      </div>
    </div>
  );
}
