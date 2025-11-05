'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../providers/AuthProvider';

interface LoginState {
  username: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [form, setForm] = useState<LoginState>({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await login({ username: form.username, password: form.password });
      router.replace('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de se connecter.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-[rgba(255,255,255,0.1)] bg-[rgba(10,10,10,0.9)] p-10 shadow-2xl"
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Connexion</h1>
        <p className="text-sm text-[var(--text-secondary)]">Accédez à votre univers StreamV8 sécurisé.</p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Identifiant
          <input
            className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-transparent px-4 py-3 text-base text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
            name="username"
            type="text"
            minLength={3}
            required
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Mot de passe
          <input
            className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-transparent px-4 py-3 text-base text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
            name="password"
            type="password"
            minLength={8}
            required
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="rounded-lg bg-[rgba(229,9,20,0.2)] px-3 py-2 text-sm text-[#ffb3b8]" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center rounded-2xl bg-[var(--accent)] px-6 py-3 text-base font-semibold uppercase tracking-wide text-white transition hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Connexion en cours…' : 'Se connecter'}
        </button>
      </form>
      <p className="text-center text-xs text-[var(--text-secondary)]">
        Protection renforcée : sessions signées, mots de passe chiffrés et suivi d’audit intégral.
      </p>
    </motion.div>
  );
}
