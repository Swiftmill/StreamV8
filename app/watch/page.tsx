import { notFound, redirect } from 'next/navigation';
import { fetchInitialSession } from '../../lib/server-session';
import { fetchMovie, fetchSeries } from '../../lib/content';
import { WatchExperience } from '../../components/player/WatchExperience';

interface WatchPageProps {
  searchParams: {
    type?: 'movie' | 'series';
    id?: string;
    slug?: string;
    s?: string;
    e?: string;
  };
}

export default async function WatchPage({ searchParams }: WatchPageProps) {
  const session = await fetchInitialSession();
  if (!session.authenticated) {
    redirect('/login');
  }
  const type = searchParams.type;
  if (!type) {
    redirect('/app');
  }

  if (type === 'movie') {
    if (!searchParams.id) {
      redirect('/app');
    }
    try {
      const { movie } = await fetchMovie(searchParams.id);
      return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a,#050505)] px-4 pb-20 pt-10 md:px-10 lg:px-16">
          <WatchExperience
            type="movie"
            contentId={movie.id}
            source={movie.streamUrl}
            poster={movie.backdropUrl}
            subtitles={movie.subtitles}
            metadata={`${movie.year} · ${movie.contentRating}`}
            title={movie.title}
          />
        </main>
      );
    } catch (error) {
      notFound();
    }
  }

  if (type === 'series') {
    if (!searchParams.slug) {
      redirect('/app');
    }
    try {
      const { series } = await fetchSeries(searchParams.slug);
      const seasonNumber = Number.parseInt(searchParams.s ?? '1', 10);
      const episodeNumber = Number.parseInt(searchParams.e ?? '1', 10);
      const season = series.seasons.find((s: any) => s.seasonNumber === seasonNumber);
      if (!season) {
        notFound();
      }
      const episode = season.episodes.find((ep: any) => ep.episodeNumber === episodeNumber);
      if (!episode) {
        notFound();
      }
      const flatEpisodes = series.seasons
        .flatMap((s: any) => s.episodes.map((ep: any) => ({ season: s.seasonNumber, episode: ep.episodeNumber, data: ep })))
        .sort((a, b) => (a.season === b.season ? a.episode - b.episode : a.season - b.season));
      const currentIndex = flatEpisodes.findIndex((item) => item.season === seasonNumber && item.episode === episodeNumber);
      const next = currentIndex >= 0 ? flatEpisodes[currentIndex + 1] : undefined;
      const nextEpisode = next
        ? {
            href: `/watch?type=series&slug=${series.slug}&s=${next.season}&e=${next.episode}`,
            label: `Lire S${next.season}E${next.episode}`
          }
        : undefined;
      return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a,#050505)] px-4 pb-20 pt-10 md:px-10 lg:px-16">
          <WatchExperience
            type="series"
            contentId={series.slug}
            source={episode.streamUrl}
            poster={series.backdropUrl}
            subtitles={episode.subtitles}
            metadata={`S${seasonNumber} · E${episodeNumber} · ${Math.round(episode.duration / 60)} min`}
            title={`${series.title} — ${episode.title}`}
            nextEpisode={nextEpisode}
            season={seasonNumber}
            episode={episodeNumber}
          />
        </main>
      );
    } catch (error) {
      notFound();
    }
  }

  notFound();
}
