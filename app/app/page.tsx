import { redirect } from 'next/navigation';
import { fetchInitialSession } from '../../lib/server-session';
import { fetchHomeData } from '../../lib/catalog';
import { HeroBanner } from '../../components/layout/HeroBanner';
import { ContentRow, type ContentRowItem } from '../../components/layout/ContentRow';
import { ContinueWatchingRow } from '../../components/layout/ContinueWatchingRow';
import { BackToTopButton } from '../../components/ui/BackToTopButton';

export const metadata = {
  title: 'Accueil | StreamV8'
};

function mapMovieToRow(movie: any): ContentRowItem {
  return {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    href: `/title/movies/${movie.id}`,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    badge: movie.featured ? 'À la une' : undefined,
    meta: `${movie.year} · ${movie.contentRating}`
  };
}

function mapSeriesToRow(series: any): ContentRowItem {
  return {
    id: series.slug,
    title: series.title,
    description: series.description,
    href: `/title/series/${series.slug}`,
    posterUrl: series.posterUrl,
    backdropUrl: series.backdropUrl,
    badge: series.featured ? 'Nouveauté' : undefined,
    meta: series.genres.join(' • ')
  };
}

export default async function AppHomePage() {
  const session = await fetchInitialSession();
  if (!session.authenticated) {
    redirect('/login');
  }

  const { movies, series, categories, history } = await fetchHomeData();
  const featured = movies.find((movie) => movie.featured) ?? movies[0];
  const movieRows = categories.map((category) => ({
    category,
    items: movies.filter((movie) => movie.categories?.includes(category.id))
  }));

  const movieRowItems = movieRows
    .filter((row) => row.items.length > 0)
    .map(({ category, items }) => ({
      category,
      items: items.map(mapMovieToRow)
    }));

  const seriesRow = {
    title: 'Séries immanquables',
    items: series.map(mapSeriesToRow)
  };

  const continueRowMovies = movieRowItems.flatMap((row) => row.items);
  const continueRowSeries = seriesRow.items;

  return (
    <main className="relative flex min-h-screen flex-col gap-16 px-6 pb-24 pt-10 md:px-10 lg:px-16">
      {featured && (
        <HeroBanner
          title={featured.title}
          description={featured.description}
          backdropUrl={featured.backdropUrl}
          ctaHref={`/watch?type=movie&id=${featured.id}`}
          meta={`${featured.year} · ${featured.contentRating}`}
        />
      )}
      <ContinueWatchingRow history={history} movies={continueRowMovies} series={continueRowSeries} />
      {movieRowItems.map(({ category, items }) => (
        <ContentRow key={category.id} title={category.name} items={items} />
      ))}
      <ContentRow title={seriesRow.title} subtitle="Sélection dynamique des séries les plus suivies." items={seriesRow.items} />
      <BackToTopButton />
    </main>
  );
}
