import { notFound, redirect } from 'next/navigation';
import { fetchInitialSession } from '../../../../lib/server-session';
import { fetchMovie } from '../../../../lib/content';
import Image from 'next/image';
import Link from 'next/link';

interface MoviePageProps {
  params: { id: string };
}

export default async function MovieDetailPage({ params }: MoviePageProps) {
  const session = await fetchInitialSession();
  if (!session.authenticated) {
    redirect('/login');
  }
  try {
    const { movie } = await fetchMovie(params.id);
    return (
      <main className="flex min-h-screen flex-col gap-10 px-6 pb-20 pt-12 md:px-12 lg:px-20">
        <section className="relative overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-black/50 shadow-2xl">
          <Image src={movie.backdropUrl} alt={movie.title} fill className="object-cover opacity-40" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="relative z-10 flex flex-col gap-6 p-10 md:max-w-3xl">
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">Film</span>
              <h1 className="text-4xl font-semibold md:text-5xl">{movie.title}</h1>
              <p className="text-sm text-[var(--text-secondary)]">{movie.year} · {movie.contentRating} · {Math.round(movie.duration / 60)} min</p>
              <p className="text-base text-[var(--text-secondary)] md:text-lg">{movie.description}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/watch?type=movie&id=${movie.id}`}
                className="flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                ▶ Lire maintenant
              </Link>
              <span className="flex items-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.24)] px-6 py-3 text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                Genres : {movie.genres.join(' • ')}
              </span>
            </div>
          </div>
        </section>
        <section className="grid gap-6 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(17,17,17,0.7)] p-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">À propos</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Publié le {new Date(movie.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}. Mise à jour {new Date(movie.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}.
            </p>
            <p className="text-sm text-[var(--text-secondary)]">Tags : {movie.tags.join(', ')}</p>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Sous-titres disponibles</h2>
            <ul className="grid gap-2 text-sm text-[var(--text-secondary)]">
              {movie.subtitles.map((subtitle: any) => (
                <li key={subtitle.language} className="rounded-xl border border-[rgba(255,255,255,0.1)] px-4 py-2">
                  {subtitle.language.toUpperCase()} — {subtitle.url}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    );
  } catch (error) {
    notFound();
  }
}
