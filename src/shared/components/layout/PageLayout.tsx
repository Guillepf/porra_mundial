import { ReactNode } from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { useAuth } from '@/app/providers/AuthProvider';

export function PageLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
      <Header />
      <div className="flex flex-1">
        {user && <Navigation />}
        <main className={`flex-1 p-4 md:p-8 overflow-y-auto mb-16 md:mb-0 ${user ? 'container' : 'max-w-7xl mx-auto w-full'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
