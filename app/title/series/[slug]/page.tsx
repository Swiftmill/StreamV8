import { notFound, redirect } from 'next/navigation';
import { fetchInitialSession } from '../../../../lib/server-session';
import { fetchSeries } from '../../../../lib/content';
import Image from 'next/image';
import Link from 'next/link';

interface SeriesPageProps {
  params: { slug: string };
}

export default async function SeriesDetailPage({ params }: SeriesPageProps) {
  const session = await fetchInitialSession();
  if (!session.authenticated) {
    redirect('/login');
  }
  try {
    const { series } = await fetchSeries(params.slug);
    return (
      <main className="flex min-h-screen flex-col gap-12 px-6 pb-24 pt-12 md:px-12 lg:px-20">
        <section className="relative overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-black/50 shadow-2xl">
          <Image src={series.backdropUrl} alt={series.title} fill className="object-cover opacity-35" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="relative z-10 flex flex-col gap-6 p-10 md:max-w-3xl">
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">Série</span>
              <h1 className="text-4xl font-semibold md:text-5xl">{series.title}</h1>
              <p className="text-sm text-[var(--text-secondary)]">{series.year} · {series.genres.join(' • ')}</p>
              <p className="text-base text-[var(--text-secondary)] md:text-lg">{series.description}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/watch?type=series&slug=${series.slug}&s=1&e=1`}
                className="flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                ▶ Lire S1E1
              </Link>
              <span className="flex items-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.24)] px-6 py-3 text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                {series.seasons.length} saison(s)
              </span>
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold">Saisons & épisodes</h2>
          <div className="flex flex-col gap-6">
            {series.seasons.map((season: any) => (
              <div key={season.seasonNumber} className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(15,15,15,0.7)] p-6">
                <div className="mb-4 flex flex-col gap-2">
                  <h3 className="text-xl font-semibold">Saison {season.seasonNumber} — {season.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{season.synopsis}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {season.episodes.map((episode: any) => (
                    <Link
                      key={episode.episodeNumber}
                      href={`/watch?type=series&slug=${series.slug}&s=${season.seasonNumber}&e=${episode.episodeNumber}`}
                      className="group flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                        <span>Épisode {episode.episodeNumber}</span>
                        <span>{Math.round(episode.duration / 60)} min</span>
                      </div>
                      <p className="text-base font-semibold text-white">{episode.title}</p>
                      <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">{episode.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  } catch (error) {
    notFound();
  }
}
