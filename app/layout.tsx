import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';
import { AuthProvider } from '@/lib/auth-provider';

export const metadata: Metadata = {
  title: 'MUZENZA Capoeira',
  description: 'Gerenciamento do Grupo MUZENZA',
  icons: {
    icon: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
    apple: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
