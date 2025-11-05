import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../components/providers/AuthProvider';
import { fetchInitialSession } from '../lib/server-session';

export const metadata: Metadata = {
  title: 'StreamV8',
  description: 'Votre plateforme ciné-séries immersive avec une expérience fluide et sécurisée.'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await fetchInitialSession();
  return (
    <html lang="fr">
      <body>
        <AuthProvider initialSession={session}>{children}</AuthProvider>
      </body>
    </html>
  );
}
