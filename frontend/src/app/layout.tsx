import type { Metadata } from 'next';
import { Playfair_Display, Source_Serif_4 } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QuizForge — AI-Powered Quizzes',
  description: 'Generate, take, and track AI-powered quizzes on any topic.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSerif.variable}`}>
      <body className="bg-cream text-ink font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f0e0c',
                color: '#f5f0e8',
                fontFamily: 'var(--font-body)',
                borderRadius: '2px',
                border: '1px solid #e8a030',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
