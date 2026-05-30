import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Compass, BarChart2, Users, User, Shield } from 'lucide-react';

export function Navigation() {
  const { user, profile } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: 'Partidos', path: '/', icon: Compass },
    { label: 'Clasificación', path: '/standings', icon: BarChart2 },
    { label: 'Comparar', path: '/compare', icon: Users },
    { label: 'Mi Perfil', path: '/profile', icon: User },
  ];

  // Agregar botón admin en móviles si corresponde
  const mobileNavItems = [...navItems];
  if (profile?.role === 'admin') {
    mobileNavItems.push({ label: 'Admin', path: '/admin', icon: Shield });
  }

  return (
    <>
      {/* Sidebar de escritorio */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4 min-h-[calc(100vh-4rem)] sticky top-16">
        <nav className="flex flex-col space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Barra de navegación inferior móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md flex justify-around items-center h-16 px-2 pb-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
