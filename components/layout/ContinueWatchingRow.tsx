import { ContentRow, type ContentRowItem } from './ContentRow';
import type { HistoryEntry } from '../../lib/catalog';

interface ContinueWatchingProps {
  history: HistoryEntry[];
  movies: ContentRowItem[];
  series: ContentRowItem[];
}

export function ContinueWatchingRow({ history, movies, series }: ContinueWatchingProps) {
  if (history.length === 0) return null;
  const map = new Map<string, ContentRowItem>();
  for (const item of movies) {
    map.set(`movie:${item.id}`, item);
  }
  for (const item of series) {
    map.set(`series:${item.id}`, item);
  }
  const items = history
    .map((entry) => {
      const key = `${entry.type}:${entry.contentId}`;
      const content = map.get(key);
      if (!content) return null;
      const progressPercent = Math.round(entry.progress * 100);
      const meta = entry.type === 'series' && entry.season && entry.episode
        ? `S${entry.season} · E${entry.episode} · ${progressPercent}%`
        : `${progressPercent}% visionné`;
      return {
        ...content,
        id: `${content.id}-${progressPercent}`,
        meta,
        badge: 'Continuer'
      } satisfies ContentRowItem;
    })
    .filter(Boolean) as ContentRowItem[];
  if (items.length === 0) return null;
  return <ContentRow title="Continuer la lecture" subtitle="Reprenez exactement où vous vous êtes arrêté." items={items} />;
}
