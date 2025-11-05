import { redirect } from 'next/navigation';
import { fetchInitialSession } from '../../lib/server-session';
import { LoginForm } from '../../components/auth/LoginForm';

export const metadata = {
  title: 'Connexion | StreamV8'
};

export default async function LoginPage() {
  const session = await fetchInitialSession();
  if (session.authenticated) {
    redirect('/app');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#1f1f1f,#050505)] px-6 py-16">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-[rgba(255,255,255,0.1)] px-4 py-1 text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
          Bienvenue sur StreamV8
        </span>
        <h1 className="text-4xl font-semibold">Retrouvez vos histoires préférées</h1>
        <p className="max-w-xl text-sm text-[var(--text-secondary)]">
          Gérez vos contenus, reprenez vos visionnages et explorez des recommandations ultra-personnalisées dans un environnement 100% sécurisé.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
