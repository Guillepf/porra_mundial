import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/shared/components/ui/Button';
import { Trophy, LogOut, Shield, Compass, BarChart2, Users, User, Sun, Moon } from 'lucide-react';

export function Header() {
  const { user, profile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-primary animate-pulse" />
          <span className="font-bold text-lg tracking-wider bg-linear-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            PORRA MUNDIAL 2026
          </span>
        </Link>

        <div className="flex items-center space-x-3">
          {/* Botón de alternancia de tema */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user && profile && (
            <>
              {profile.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="hidden md:flex items-center space-x-1 border-primary/50 hover:bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Admin</span>
                  </Button>
                </Link>
              )}

              <div className="flex items-center space-x-2">
                <Link to="/profile" className="flex items-center space-x-2 hover:opacity-85 transition-opacity">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={profile.displayName}
                      className="h-8 w-8 rounded-full border-2 border-primary/45 object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full border-2 border-primary/45 bg-muted flex items-center justify-center font-bold text-sm text-primary">
                      {profile.displayName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline text-sm font-semibold text-foreground">
                    {profile.displayName}
                  </span>
                </Link>

                <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
                  <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
